from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin

from apps.elearning.models.course import Subject, Course
from apps.elearning.serializers.course import (
    SubjectSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
)
from apps.elearning.serializers.enrollment import (
    EnrollSerializer,
    EnrollmentListSerializer,
)


class SubjectViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/elearning/subjects/              [public]
    POST   /api/v1/elearning/subjects/              [admin]
    GET    /api/v1/elearning/subjects/{slug}/       [public]
    PATCH  /api/v1/elearning/subjects/{slug}/       [admin]
    DELETE /api/v1/elearning/subjects/{slug}/       [admin]
    """

    queryset = (
        Subject.objects.filter(deleted_at__isnull=True)
        .prefetch_related("courses")
        .order_by("name")
    )
    serializer_class = SubjectSerializer
    pagination_class = StandardPagination
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()


class CourseViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/elearning/courses/                         [public]
    POST   /api/v1/elearning/courses/                         [staff/admin]
    GET    /api/v1/elearning/courses/{slug}/                  [public]
    PATCH  /api/v1/elearning/courses/{slug}/                  [instructor | admin]
    DELETE /api/v1/elearning/courses/{slug}/                  [admin]
    POST   /api/v1/elearning/courses/{slug}/publish/          [staff/admin]
    POST   /api/v1/elearning/courses/{slug}/unpublish/        [staff/admin]
    POST   /api/v1/elearning/courses/{slug}/enroll/           [authenticated]
    GET    /api/v1/elearning/courses/{slug}/enrollments/      [staff/admin]
    """

    queryset = (
        Course.objects.filter(deleted_at__isnull=True)
        .select_related("subject", "instructor")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("create", "publish", "unpublish"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        return CourseDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            qs = qs.filter(is_published=True)

        subject_slug = self.request.query_params.get("subject")
        difficulty    = self.request.query_params.get("difficulty")
        is_free       = self.request.query_params.get("is_free")
        search        = self.request.query_params.get("search")
        instructor_id = self.request.query_params.get("instructor")

        if subject_slug:
            qs = qs.filter(subject__slug=subject_slug)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if is_free is not None:
            qs = qs.filter(is_free=is_free.lower() == "true")
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(description__icontains=search)
        if instructor_id:
            qs = qs.filter(instructor_id=instructor_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def publish(self, request, slug=None):
        course = self.get_object()
        course.is_published = True
        course.save(update_fields=["is_published"])
        return Response({"detail": f"'{course.title}' is now published."})

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def unpublish(self, request, slug=None):
        course = self.get_object()
        course.is_published = False
        course.save(update_fields=["is_published"])
        return Response({"detail": f"'{course.title}' has been unpublished."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def enroll(self, request, slug=None):
        course = self.get_object()
        serializer = EnrollSerializer(
            data={"course_id": str(course.id)}, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response(
            EnrollmentListSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsStaffOrAdmin])
    def enrollments(self, request, slug=None):
        course = self.get_object()
        qs = course.enrollments.select_related("user").order_by("-enrolled_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(EnrollmentListSerializer(page, many=True).data)
        return Response(EnrollmentListSerializer(qs, many=True).data)