from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination

from apps.elearning.models.enrollment import Enrollment
from apps.elearning.serializers.enrollment import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer,
)


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET    /api/v1/elearning/enrollments/              [authenticated — own | admin — all]
    GET    /api/v1/elearning/enrollments/{id}/         [owner | staff/admin]
    GET    /api/v1/elearning/enrollments/my-courses/   [authenticated]
    DELETE /api/v1/elearning/enrollments/{id}/         [owner | admin — unenroll]
    """

    pagination_class = StandardPagination
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return EnrollmentListSerializer
        return EnrollmentDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            Enrollment.objects.filter(deleted_at__isnull=True)
            .select_related("user", "course__subject")
            .order_by("-enrolled_at")
        )

        if user.role in ("admin", "staff"):
            course_id = self.request.query_params.get("course")
            user_id = self.request.query_params.get("user")
            is_completed = self.request.query_params.get("is_completed")

            if course_id:
                qs = qs.filter(course_id=course_id)
            if user_id:
                qs = qs.filter(user_id=user_id)
            if is_completed is not None:
                if is_completed.lower() == "true":
                    qs = qs.filter(completed_at__isnull=False)
                else:
                    qs = qs.filter(completed_at__isnull=True)
        else:
            qs = qs.filter(user=user)

        return qs

    @action(detail=False, methods=["get"])
    def my_courses(self, request):
        """GET /api/v1/elearning/enrollments/my-courses/ — shortcut for the student dashboard."""
        qs = (
            Enrollment.objects.filter(user=request.user, deleted_at__isnull=True)
            .select_related("course__subject", "course__instructor")
            .order_by("-enrolled_at")
        )

        is_completed = request.query_params.get("is_completed")
        if is_completed is not None:
            if is_completed.lower() == "true":
                qs = qs.filter(completed_at__isnull=False)
            else:
                qs = qs.filter(completed_at__isnull=True)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = EnrollmentListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = EnrollmentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/v1/elearning/enrollments/{id}/ — unenroll."""
        enrollment = self.get_object()
        if enrollment.user != request.user and request.user.role not in (
            "admin",
            "staff",
        ):
            return Response(
                {"detail": "You do not have permission to unenroll this user."},
                status=status.HTTP_403_FORBIDDEN,
            )
        enrollment.soft_delete()
        return Response(
            {"detail": "Successfully unenrolled."},
            status=status.HTTP_204_NO_CONTENT,
        )

    http_method_names = ["get", "delete", "head", "options"]
