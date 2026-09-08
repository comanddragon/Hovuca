from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin, IsOwnerOrAdmin

from apps.volunteers.models import VolunteerProfile, VolunteerTask
from .serializers import (
    VolunteerProfileListSerializer,
    VolunteerProfileDetailSerializer,
    VolunteerProfileWriteSerializer,
    VolunteerTaskSerializer,
    VolunteerTaskListSerializer,
)


class VolunteerProfileViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/volunteers/                  [staff/admin]
    POST   /api/v1/volunteers/                  [authenticated — creates own profile]
    GET    /api/v1/volunteers/{id}/             [staff/admin | owner]
    PATCH  /api/v1/volunteers/{id}/             [owner | admin]
    DELETE /api/v1/volunteers/{id}/             [admin]
    GET    /api/v1/volunteers/{id}/tasks/       [owner | staff/admin]
    GET    /api/v1/volunteers/me/               [authenticated]
    """

    queryset = (
        VolunteerProfile.objects.filter(deleted_at__isnull=True)
        .select_related("user", "department")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("update", "partial_update"):
            return [IsOwnerOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        if self.action == "list":
            return [IsStaffOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return VolunteerProfileListSerializer
        if self.action in ("create", "update", "partial_update"):
            return VolunteerProfileWriteSerializer
        return VolunteerProfileDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        availability = self.request.query_params.get("availability")
        department_id = self.request.query_params.get("department")

        if availability:
            qs = qs.filter(availability=availability)
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """GET /api/v1/volunteers/me/ — retrieve the caller's own volunteer profile."""
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return Response(
                {"detail": "Volunteer profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = VolunteerProfileDetailSerializer(
            profile, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        """GET /api/v1/volunteers/{id}/tasks/"""
        profile = self.get_object()
        self.check_object_permissions(request, profile)
        tasks = profile.tasks.filter(deleted_at__isnull=True).order_by("-created_at")
        serializer = VolunteerTaskListSerializer(tasks, many=True)
        return Response(serializer.data)


class VolunteerTaskViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/volunteer-tasks/
    POST   /api/v1/volunteer-tasks/       [staff/admin]
    GET    /api/v1/volunteer-tasks/{id}/
    PATCH  /api/v1/volunteer-tasks/{id}/  [staff/admin | owner]
    DELETE /api/v1/volunteer-tasks/{id}/  [admin]
    """

    queryset = (
        VolunteerTask.objects.filter(deleted_at__isnull=True)
        .select_related("volunteer__user", "project")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return VolunteerTaskListSerializer
        return VolunteerTaskSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Non-admin/staff see only their own tasks
        if user.role not in ("admin", "staff"):
            try:
                qs = qs.filter(volunteer=user.volunteer_profile)
            except VolunteerProfile.DoesNotExist:
                return qs.none()

        status_filter = self.request.query_params.get("status")
        volunteer_id = self.request.query_params.get("volunteer")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if volunteer_id and user.role in ("admin", "staff"):
            qs = qs.filter(volunteer_id=volunteer_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()
