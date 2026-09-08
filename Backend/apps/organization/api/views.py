from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdminOrReadOnly

from apps.organization.models import Organization, Branch, Department
from .serializers import (
    OrganizationListSerializer,
    OrganizationDetailSerializer,
    BranchListSerializer,
    BranchDetailSerializer,
    DepartmentSerializer,
)


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/organizations/
    POST   /api/v1/organizations/               [admin]
    GET    /api/v1/organizations/{id}/
    PATCH  /api/v1/organizations/{id}/          [admin]
    DELETE /api/v1/organizations/{id}/          [admin]
    GET    /api/v1/organizations/{id}/branches/ [authenticated]
    """

    queryset = Organization.objects.filter(deleted_at__isnull=True).order_by("name")
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action == "list":
            return OrganizationListSerializer
        return OrganizationDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def branches(self, request, pk=None):
        org = self.get_object()
        branches = org.branches.filter(deleted_at__isnull=True)
        serializer = BranchListSerializer(branches, many=True)
        return Response(serializer.data)


class BranchViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/branches/
    POST   /api/v1/branches/                  [admin]
    GET    /api/v1/branches/{id}/
    PATCH  /api/v1/branches/{id}/             [admin]
    DELETE /api/v1/branches/{id}/             [admin]
    GET    /api/v1/branches/{id}/departments/ [authenticated]
    """

    queryset = (
        Branch.objects.filter(deleted_at__isnull=True)
        .select_related("organization", "manager")
        .order_by("name")
    )
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action == "list":
            return BranchListSerializer
        return BranchDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        org_id = self.request.query_params.get("organization")
        is_active = self.request.query_params.get("is_active")
        if org_id:
            qs = qs.filter(organization_id=org_id)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def departments(self, request, pk=None):
        branch = self.get_object()
        departments = branch.departments.filter(deleted_at__isnull=True)
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/departments/
    POST   /api/v1/departments/       [admin]
    GET    /api/v1/departments/{id}/
    PATCH  /api/v1/departments/{id}/  [admin]
    DELETE /api/v1/departments/{id}/  [admin]
    """

    queryset = (
        Department.objects.filter(deleted_at__isnull=True)
        .select_related("branch", "head")
        .order_by("name")
    )
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        branch_id = self.request.query_params.get("branch")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()
