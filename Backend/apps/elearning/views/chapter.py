from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin

from apps.elearning.models.chapter import Chapter
from apps.elearning.models.enrollment import Enrollment, ChapterProgress
from apps.elearning.serializers.chapter import (
    ChapterListSerializer,
    ChapterDetailSerializer,
    ChapterWriteSerializer,
)
from apps.elearning.serializers.enrollment import (
    ChapterProgressSerializer,
)


class ChapterViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/elearning/chapters/                     [enrolled | staff/admin]
    POST   /api/v1/elearning/chapters/                     [staff/admin]
    GET    /api/v1/elearning/chapters/{id}/                [enrolled | staff/admin]
    PATCH  /api/v1/elearning/chapters/{id}/                [staff/admin]
    DELETE /api/v1/elearning/chapters/{id}/                [admin]
    POST   /api/v1/elearning/chapters/{id}/complete/       [enrolled student]

    Filter: ?module=<uuid>
    """

    queryset = (
        Chapter.objects.filter(deleted_at__isnull=True)
        .select_related("module__course")
        .order_by("order")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return ChapterListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ChapterWriteSerializer
        return ChapterDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        module_id = self.request.query_params.get("module")

        if module_id:
            qs = qs.filter(module_id=module_id)

        # Non-staff: only return chapters from courses they're enrolled in
        # (preview chapters are visible to all authenticated users)
        if user.is_authenticated and user.role not in ("admin", "staff"):
            enrolled_course_ids = Enrollment.objects.filter(user=user).values_list(
                "course_id", flat=True
            )
            qs = qs.filter(module__course_id__in=enrolled_course_ids) | qs.filter(
                is_preview=True
            )

        return qs.distinct()

    def retrieve(self, request, *args, **kwargs):
        chapter = self.get_object()
        user = request.user

        # Gate non-preview chapters behind enrollment
        if not chapter.is_preview and user.role not in ("admin", "staff"):
            course = chapter.module.course
            if not Enrollment.objects.filter(user=user, course=course).exists():
                return Response(
                    {
                        "detail": "You must be enrolled in this course to access this chapter."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = self.get_serializer(chapter)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """
        POST /api/v1/elearning/chapters/{id}/complete/
        Marks a chapter as completed for the requesting student's enrollment.
        """
        chapter = self.get_object()
        course = chapter.module.course

        try:
            enrollment = Enrollment.objects.get(user=request.user, course=course)
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress, created = ChapterProgress.objects.get_or_create(
            enrollment=enrollment, chapter=chapter
        )
        if not progress.completed_at:
            progress.mark_complete()

        # Check if the full course is now complete
        total_chapters = Chapter.objects.filter(
            module__course=course, deleted_at__isnull=True
        ).count()
        completed_chapters = ChapterProgress.objects.filter(
            enrollment=enrollment, completed_at__isnull=False
        ).count()

        if total_chapters > 0 and completed_chapters >= total_chapters:
            enrollment.mark_complete()
            # Trigger certificate generation task
            try:
                from apps.elearning.tasks import generate_certificate

                generate_certificate.enqueue(str(enrollment.id))
            except Exception:
                pass

        return Response(
            {
                "detail": "Chapter marked as complete.",
                "progress": ChapterProgressSerializer(progress).data,
                "course_progress_percentage": enrollment.progress_percentage,
                "course_completed": enrollment.is_completed,
            }
        )
