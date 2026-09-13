from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin

from apps.donations.models import Donation, DonationCampaign
from .serializers import (
    DonationCampaignListSerializer,
    DonationCampaignDetailSerializer,
    DonationCampaignWriteSerializer,
    DonationListSerializer,
    DonationDetailSerializer,
    DonationCreateSerializer,
)


class DonationCampaignViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/campaigns/                   [public]
    POST   /api/v1/campaigns/                   [staff/admin]
    GET    /api/v1/campaigns/{id}/              [public]
    PATCH  /api/v1/campaigns/{id}/              [staff/admin]
    DELETE /api/v1/campaigns/{id}/              [admin]
    GET    /api/v1/campaigns/{id}/donations/    [staff/admin]
    POST   /api/v1/campaigns/{id}/close/        [admin]
    """

    queryset = (
        DonationCampaign.objects.filter(deleted_at__isnull=True)
        .select_related("program")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action in ("destroy", "close"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return DonationCampaignListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DonationCampaignWriteSerializer
        return DonationCampaignDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        campaign_status = self.request.query_params.get("status")
        program_id = self.request.query_params.get("program")

        if campaign_status:
            qs = qs.filter(status=campaign_status)
        if program_id:
            qs = qs.filter(program_id=program_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get"], permission_classes=[IsStaffOrAdmin])
    def donations(self, request, pk=None):
        """GET /api/v1/campaigns/{id}/donations/ — list all donations for a campaign."""
        campaign = self.get_object()
        qs = campaign.donations.filter(deleted_at__isnull=True).order_by("-created_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = DonationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = DonationListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def close(self, request, pk=None):
        """POST /api/v1/campaigns/{id}/close/ — close a campaign."""
        campaign = self.get_object()
        campaign.status = DonationCampaign.Status.CLOSED
        campaign.save(update_fields=["status"])
        return Response(
            {"detail": f"Campaign '{campaign.title}' has been closed."},
            status=status.HTTP_200_OK,
        )


class DonationViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/donations/         [authenticated — own donations; admin — all]
    POST   /api/v1/donations/         [authenticated]
    GET    /api/v1/donations/{id}/    [owner | admin]
    DELETE /api/v1/donations/{id}/    [admin]
    GET    /api/v1/donations/summary/ [admin]
    """

    pagination_class = StandardPagination
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return DonationCreateSerializer
        if self.action == "list":
            return DonationListSerializer
        return DonationDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            Donation.objects.filter(deleted_at__isnull=True)
            .select_related("donor", "campaign")
            .order_by("-created_at")
        )

        if user.role in ("admin", "staff"):
            # Admin/staff can filter by any donor
            donor_id = self.request.query_params.get("donor")
            campaign_id = self.request.query_params.get("campaign")
            donation_status = self.request.query_params.get("status")
            gateway = self.request.query_params.get("gateway")

            if donor_id:
                qs = qs.filter(donor_id=donor_id)
            if campaign_id:
                qs = qs.filter(campaign_id=campaign_id)
            if donation_status:
                qs = qs.filter(status=donation_status)
            if gateway:
                qs = qs.filter(gateway=gateway)
        else:
            # Regular users see only their own donations
            qs = qs.filter(donor=user)

        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        donation = serializer.save()

        # Trigger payment processing task
        try:
            from apps.donations.tasks import process_donation_payment

            process_donation_payment.enqueue(str(donation.id))
        except Exception:
            pass

        return Response(
            DonationDetailSerializer(donation).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=["get"], permission_classes=[IsStaffOrAdmin])
    def summary(self, request):
        """GET /api/v1/donations/summary/ — aggregated donation stats."""
        from django.db.models import Sum, Count, Avg

        qs = Donation.objects.filter(
            status=Donation.Status.COMPLETED,
            deleted_at__isnull=True,
        )
        stats = qs.aggregate(
            total_raised=Sum("amount"),
            total_donations=Count("id"),
            average_donation=Avg("amount"),
        )
        return Response(
            {
                "total_raised": stats["total_raised"] or 0,
                "total_donations": stats["total_donations"] or 0,
                "average_donation": round(float(stats["average_donation"] or 0), 2),
                "by_gateway": list(
                    qs.values("gateway").annotate(
                        count=Count("id"), total=Sum("amount")
                    )
                ),
            }
        )
