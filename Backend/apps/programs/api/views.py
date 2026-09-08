from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsStaffOrAdmin

from apps.programs.models import Program, Project
from .serializers import (
    ProgramListSerializer,
    ProgramDetailSerializer,
    ProjectListSerializer,
    ProjectDetailSerializer,
)


class ProgramViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/programs/
    POST   /api/v1/programs/               [staff/admin]
    GET    /api/v1/programs/{slug}/
    PATCH  /api/v1/programs/{slug}/          [staff/admin]
    DELETE /api/v1/programs/{slug}/          [admin]
    GET    /api/v1/programs/{slug}/projects/ [authenticated]
    """
    lookup_field = "slug"
    queryset = (
        Program.objects.filter(deleted_at__isnull=True)
        .select_related("organization")
        .prefetch_related("projects")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            from core.permissions import IsAdmin

            return [IsAdmin()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == "list":
            return ProgramListSerializer
        return ProgramDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        org_id = self.request.query_params.get("organization")
        search = self.request.query_params.get("search")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get"])
    def projects(self, request, slug=None):
        program = self.get_object()
        projects = program.projects.filter(deleted_at__isnull=True)
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/projects/
    POST   /api/v1/projects/       [staff/admin]
    GET    /api/v1/projects/{slug}/
    PATCH  /api/v1/projects/{slug}/  [staff/admin]
    DELETE /api/v1/projects/{slug}/  [admin]
    """
    lookup_field = "slug"
    queryset = (
        Project.objects.filter(deleted_at__isnull=True)
        .select_related("program", "lead")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            from core.permissions import IsAdmin
            return [IsAdmin()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        program_slug = self.request.query_params.get("program")  # ← renamed for clarity
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if program_slug:
            qs = qs.filter(program__slug=program_slug)  # ← was program_id=program_id
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()
