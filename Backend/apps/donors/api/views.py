from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin, IsStaffOrAdmin

from apps.donors.models import DonorOrganization, DonorContact, Grant, DonorEngagement
from apps.donors import services

from .serializers import (
    DonorOrganizationListSerializer,
    DonorOrganizationDetailSerializer,
    DonorOrganizationWriteSerializer,
    DonorContactSerializer,
    DonorContactWriteSerializer,
    GrantListSerializer,
    GrantDetailSerializer,
    GrantWriteSerializer,
    DonorEngagementSerializer,
    DonorEngagementWriteSerializer,
    DonorSummarySerializer,
)


# ---------------------------------------------------------------------------
# DonorOrganization
# ---------------------------------------------------------------------------


class DonorOrganizationViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/donors/organizations/              [staff+]
    POST   /api/v1/donors/organizations/              [admin]
    GET    /api/v1/donors/organizations/{id}/         [staff+]
    PATCH  /api/v1/donors/organizations/{id}/         [admin]
    DELETE /api/v1/donors/organizations/{id}/         [admin]
    POST   /api/v1/donors/organizations/{id}/recalculate/   [admin]
    """

    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return DonorOrganizationListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DonorOrganizationWriteSerializer
        return DonorOrganizationDetailSerializer

    def get_queryset(self):
        return services.get_donor_organizations_queryset(self.request.query_params)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["post"], url_path="recalculate")
    def recalculate(self, request, pk=None):
        """Force-recalculate totals and tier for this donor."""
        org = self.get_object()
        org.recalculate_totals()
        services.recalculate_donor_tier(org)
        return Response(
            {"detail": f"Totals recalculated for {org.name}."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="grants")
    def grants(self, request, pk=None):
        """List all grants for this donor organization."""
        org = self.get_object()
        qs = org.grants.filter(deleted_at__isnull=True).order_by("-disbursed_date")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = GrantListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = GrantListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="engagements")
    def engagements(self, request, pk=None):
        """List all engagement logs for this donor organization."""
        org = self.get_object()
        qs = org.engagements.filter(deleted_at__isnull=True).order_by("-date")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = DonorEngagementSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = DonorEngagementSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="contacts")
    def contacts(self, request, pk=None):
        """List all contacts for this donor organization."""
        org = self.get_object()
        qs = org.contacts.filter(deleted_at__isnull=True).order_by("-is_primary", "last_name")
        serializer = DonorContactSerializer(qs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# DonorContact
# ---------------------------------------------------------------------------


class DonorContactViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/donors/contacts/          [staff+]
    POST   /api/v1/donors/contacts/          [admin]
    GET    /api/v1/donors/contacts/{id}/     [staff+]
    PATCH  /api/v1/donors/contacts/{id}/     [admin]
    DELETE /api/v1/donors/contacts/{id}/     [admin]
    """

    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return DonorContactWriteSerializer
        return DonorContactSerializer

    def get_queryset(self):
        qs = DonorContact.objects.filter(deleted_at__isnull=True).select_related("organization")
        org_id = self.request.query_params.get("organization")
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs.order_by("-is_primary", "last_name")

    def perform_destroy(self, instance):
        instance.soft_delete()


# ---------------------------------------------------------------------------
# Grant
# ---------------------------------------------------------------------------


class GrantViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/donors/grants/                           [staff+]
    POST   /api/v1/donors/grants/                           [admin]
    GET    /api/v1/donors/grants/{id}/                      [staff+]
    PATCH  /api/v1/donors/grants/{id}/                      [admin]
    DELETE /api/v1/donors/grants/{id}/                      [admin]
    POST   /api/v1/donors/grants/{id}/complete/             [admin]
    POST   /api/v1/donors/grants/{id}/submit-report/        [staff+]
    """

    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve", "submit_report"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return GrantListSerializer
        if self.action in ("create", "update", "partial_update"):
            return GrantWriteSerializer
        return GrantDetailSerializer

    def get_queryset(self):
        qs = Grant.objects.filter(deleted_at__isnull=True).select_related(
            "donor_organization", "program", "project", "contact", "internal_owner"
        )
        params = self.request.query_params
        donor = params.get("donor")
        status_ = params.get("status")
        funding_type = params.get("funding_type")
        program = params.get("program")
        year = params.get("year")
        search = params.get("search")

        if donor:
            qs = qs.filter(donor_organization_id=donor)
        if status_:
            qs = qs.filter(status=status_)
        if funding_type:
            qs = qs.filter(funding_type=funding_type)
        if program:
            qs = qs.filter(program_id=program)
        if year:
            qs = qs.filter(disbursed_date__year=year)
        if search:
            qs = qs.filter(
                title__icontains=search
            ) | qs.filter(reference_code__icontains=search)

        return qs.order_by("-disbursed_date", "-created_at")

    def perform_create(self, serializer):
        grant = services.create_grant(
            serializer.validated_data,
            internal_owner=self.request.user,
        )
        # Replace the instance so DRF returns the saved object
        serializer.instance = grant

    def perform_update(self, serializer):
        services.update_grant(serializer.instance, serializer.validated_data)

    def perform_destroy(self, instance):
        instance.soft_delete()
        services._sync_donor_after_grant(instance.donor_organization)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """Mark this grant as completed (disbursed)."""
        grant = self.get_object()
        if grant.status == Grant.Status.COMPLETED:
            return Response(
                {"detail": "Grant is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        grant = services.mark_grant_completed(grant)
        return Response(GrantDetailSerializer(grant).data)

    @action(detail=True, methods=["post"], url_path="submit-report")
    def submit_report(self, request, pk=None):
        """Record that the final report for this grant has been submitted."""
        grant = self.get_object()
        if grant.report_submitted:
            return Response(
                {"detail": "Report already marked as submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        grant = services.mark_report_submitted(grant)
        return Response(
            {"detail": "Report marked as submitted.", "report_submitted_at": grant.report_submitted_at},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# DonorEngagement
# ---------------------------------------------------------------------------


class DonorEngagementViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/donors/engagements/          [staff+]
    POST   /api/v1/donors/engagements/          [staff+]
    GET    /api/v1/donors/engagements/{id}/     [staff+]
    PATCH  /api/v1/donors/engagements/{id}/     [staff+]
    DELETE /api/v1/donors/engagements/{id}/     [admin]
    """

    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action == "destroy":
            return [AllowAny()]
        return [IsStaffOrAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return DonorEngagementWriteSerializer
        return DonorEngagementSerializer

    def get_queryset(self):
        qs = DonorEngagement.objects.filter(deleted_at__isnull=True).select_related(
            "organization", "contact", "logged_by", "grant"
        )
        params = self.request.query_params
        org = params.get("organization")
        type_ = params.get("type")

        if org:
            qs = qs.filter(organization_id=org)
        if type_:
            qs = qs.filter(type=type_)

        return qs.order_by("-date", "-created_at")

    def perform_create(self, serializer):
        engagement = services.log_engagement(
            serializer.validated_data, logged_by=self.request.user
        )
        serializer.instance = engagement

    def perform_destroy(self, instance):
        instance.soft_delete()


# ---------------------------------------------------------------------------
# Summary / Dashboard
# ---------------------------------------------------------------------------


class DonorSummaryView(generics.GenericAPIView):
    """
    GET /api/v1/donors/summary/
    Returns high-level stats for the donors dashboard.
    """

    permission_classes = [IsStaffOrAdmin]
    serializer_class = DonorSummarySerializer

    def get(self, request):
        data = services.get_donor_summary()
        serializer = self.get_serializer(data)
        return Response(serializer.data)