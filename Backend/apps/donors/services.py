"""
apps/donors/services.py
========================
Business logic for the donors app, kept separate from views.
"""

from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone

from apps.donors.models import DonorOrganization, Grant, DonorEngagement


# ---------------------------------------------------------------------------
# DonorOrganization
# ---------------------------------------------------------------------------


def get_donor_organizations_queryset(params: dict):
    """
    Return a filtered queryset of DonorOrganization based on query params.
    Annotates with grant_count for list views.
    """
    from django.db.models import Count

    qs = DonorOrganization.objects.filter(deleted_at__isnull=True).annotate(
        grant_count=Count("grants", filter=Q(grants__deleted_at__isnull=True))
    )

    status = params.get("status")
    tier = params.get("tier")
    type_ = params.get("type")
    country = params.get("country")
    search = params.get("search")

    if status:
        qs = qs.filter(status=status)
    if tier:
        qs = qs.filter(tier=tier)
    if type_:
        qs = qs.filter(type=type_)
    if country:
        qs = qs.filter(country__icontains=country)
    if search:
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(abbreviation__icontains=search)
            | Q(city__icontains=search)
            | Q(email__icontains=search)
        )

    return qs.order_by("-total_funded", "name")


def recalculate_donor_tier(donor: DonorOrganization) -> None:
    """
    Auto-set tier based on total_funded amount in USD.
    Platinum > 100 000 | Gold 25 000–100 000 | Silver 5 000–24 999 | Bronze < 5 000
    """
    total = donor.total_funded
    if total >= 100_000:
        donor.tier = DonorOrganization.Tier.PLATINUM
    elif total >= 25_000:
        donor.tier = DonorOrganization.Tier.GOLD
    elif total >= 5_000:
        donor.tier = DonorOrganization.Tier.SILVER
    else:
        donor.tier = DonorOrganization.Tier.BRONZE
    donor.save(update_fields=["tier"])


# ---------------------------------------------------------------------------
# Grant
# ---------------------------------------------------------------------------


@transaction.atomic
def create_grant(validated_data: dict, internal_owner=None) -> Grant:
    """Create a grant and update donor totals + tier."""
    if internal_owner:
        validated_data.setdefault("internal_owner", internal_owner)
    grant = Grant.objects.create(**validated_data)
    _sync_donor_after_grant(grant.donor_organization)
    return grant


@transaction.atomic
def update_grant(grant: Grant, validated_data: dict) -> Grant:
    """Update a grant and re-sync donor totals + tier."""
    for attr, value in validated_data.items():
        setattr(grant, attr, value)
    grant.save()
    _sync_donor_after_grant(grant.donor_organization)
    return grant


@transaction.atomic
def mark_grant_completed(grant: Grant) -> Grant:
    """Mark a grant as completed and update the donor record."""
    grant.status = Grant.Status.COMPLETED
    if not grant.disbursed_date:
        grant.disbursed_date = timezone.now().date()
    grant.save(update_fields=["status", "disbursed_date"])
    _sync_donor_after_grant(grant.donor_organization)
    return grant


@transaction.atomic
def mark_report_submitted(grant: Grant) -> Grant:
    """Record that the donor report for this grant has been submitted."""
    grant.report_submitted = True
    grant.report_submitted_at = timezone.now()
    grant.save(update_fields=["report_submitted", "report_submitted_at"])
    return grant


def _sync_donor_after_grant(donor: DonorOrganization) -> None:
    """Re-calculate totals + tier for the given donor."""
    donor.recalculate_totals()
    recalculate_donor_tier(donor)
    # Auto-update status: if they have any completed grant, mark active
    has_grants = donor.grants.filter(
        deleted_at__isnull=True, status=Grant.Status.COMPLETED
    ).exists()
    if has_grants and donor.status == DonorOrganization.Status.INACTIVE:
        donor.status = DonorOrganization.Status.ACTIVE
        donor.save(update_fields=["status"])


# ---------------------------------------------------------------------------
# Summary / Analytics
# ---------------------------------------------------------------------------


def get_donor_summary() -> dict:
    """
    Return a high-level stats summary for the donors dashboard.
    """
    orgs = DonorOrganization.objects.filter(deleted_at__isnull=True)
    grants = Grant.objects.filter(deleted_at__isnull=True)

    tier_counts = {
        row["tier"]: row["count"]
        for row in orgs.values("tier").annotate(count=Count("id"))
    }

    total_funded = (
        grants.filter(status=Grant.Status.COMPLETED).aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )

    return {
        "total_organizations": orgs.count(),
        "active_organizations": orgs.filter(status=DonorOrganization.Status.ACTIVE).count(),
        "total_grants": grants.count(),
        "total_funded_usd": total_funded,
        "platinum_count": tier_counts.get(DonorOrganization.Tier.PLATINUM, 0),
        "gold_count": tier_counts.get(DonorOrganization.Tier.GOLD, 0),
        "silver_count": tier_counts.get(DonorOrganization.Tier.SILVER, 0),
        "bronze_count": tier_counts.get(DonorOrganization.Tier.BRONZE, 0),
    }


# ---------------------------------------------------------------------------
# Engagement
# ---------------------------------------------------------------------------


def log_engagement(validated_data: dict, logged_by) -> DonorEngagement:
    """Create an engagement log entry."""
    validated_data["logged_by"] = logged_by
    return DonorEngagement.objects.create(**validated_data)
