from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin, IsStaffOrAdmin

from apps.elearning.models.module import Module
from apps.elearning.serializers.module import (
    ModuleListSerializer,
    ModuleDetailSerializer,
    ModuleWriteSerializer,
)


class ModuleViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/elearning/modules/        [authenticated]
    POST   /api/v1/elearning/modules/        [staff/admin]
    GET    /api/v1/elearning/modules/{id}/   [authenticated]
    PATCH  /api/v1/elearning/modules/{id}/   [staff/admin]
    DELETE /api/v1/elearning/modules/{id}/   [admin]

    Filter: ?course=<uuid>
    """

    queryset = (
        Module.objects.filter(deleted_at__isnull=True)
        .select_related("course")
        .prefetch_related("chapters")
        .order_by("order")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return ModuleListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ModuleWriteSerializer
        return ModuleDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()
