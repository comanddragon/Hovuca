"""HOVUCA data for the Unfold admin landing page."""

from __future__ import annotations

import json
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.blogs.models import Article
from apps.donations.models import Donation
from apps.programs.models import Program, Project
from apps.volunteers.models import VolunteerProfile


def _change(current: Decimal | int, previous: Decimal | int) -> dict[str, object]:
    current_value = Decimal(current or 0)
    previous_value = Decimal(previous or 0)
    percentage = (
        (Decimal(100) if current_value > 0 else Decimal(0))
        if previous_value == 0
        else round(((current_value - previous_value) / previous_value) * 100, 1)
    )
    return {
        "delta": abs(percentage),
        "direction": "up" if percentage > 0 else "down" if percentage < 0 else "flat",
    }


def _money(value: Decimal | int, currency: str = "USD") -> str:
    symbols = {"USD": "$", "GBP": "£", "EUR": "€", "NGN": "₦", "XAF": "FCFA "}
    return f"{symbols.get(currency, f'{currency} ')}{Decimal(value or 0):,.2f}"


def _short_date(value, format_string: str) -> str:
    return value.strftime(format_string).replace(" 0", " ")


def dashboard_callback(request, context):
    """Add a concise overview of HOVUCA's work to the admin index context."""
    today = timezone.localdate()
    hour = timezone.localtime().hour
    greeting = (
        "Good morning"
        if hour < 12
        else "Good afternoon"
        if hour < 18
        else "Good evening"
    )
    period_start = today - timedelta(days=29)
    previous_start = period_start - timedelta(days=30)
    previous_end = period_start - timedelta(days=1)

    completed = Donation.objects.filter(status=Donation.Status.COMPLETED)
    current = completed.filter(created_at__date__range=(period_start, today))
    previous = completed.filter(created_at__date__range=(previous_start, previous_end))
    current_summary = current.aggregate(
        amount=Sum("amount", default=Decimal(0)),
        donations=Count("id"),
        donors=Count("donor_id", distinct=True),
    )
    previous_summary = previous.aggregate(
        amount=Sum("amount", default=Decimal(0)),
        donations=Count("id"),
        donors=Count("donor_id", distinct=True),
    )

    daily_rows = {
        row["day"]: row
        for row in current.annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(amount=Sum("amount"), donations=Count("id"))
        .order_by("day")
    }
    chart_days = [today - timedelta(days=13 - offset) for offset in range(14)]
    donation_chart = {
        "labels": [_short_date(day, "%b %d") for day in chart_days],
        "datasets": [
            {
                "label": "Donations",
                "data": [
                    float(daily_rows.get(day, {}).get("amount") or 0)
                    for day in chart_days
                ],
                "borderColor": "#16a34a",
                "backgroundColor": "rgba(22, 163, 74, 0.12)",
                "fill": True,
                "tension": 0.35,
                "pointRadius": 2,
                "pointHoverRadius": 5,
            }
        ],
    }
    chart_options = {
        "maintainAspectRatio": False,
        "plugins": {"legend": {"display": False}},
        "scales": {
            "x": {"grid": {"display": False}},
            "y": {"beginAtZero": True, "grid": {"color": "rgba(148, 163, 184, .16)"}},
        },
    }

    status_counts = dict(
        Donation.objects.filter(created_at__date__gte=period_start)
        .values_list("status")
        .annotate(total=Count("id"))
    )
    status_total = sum(status_counts.values()) or 1
    status_rows = [
        {
            "label": label,
            "count": status_counts.get(value, 0),
            "percentage": round(status_counts.get(value, 0) / status_total * 100),
            "tone": {
                Donation.Status.COMPLETED: "green",
                Donation.Status.PENDING: "amber",
                Donation.Status.FAILED: "red",
                Donation.Status.REFUNDED: "red",
            }.get(value, "purple"),
        }
        for value, label in Donation.Status.choices
        if status_counts.get(value, 0)
    ]

    programs = (
        Program.objects.filter(status=Program.Status.ACTIVE)
        .annotate(
            project_count=Count("projects", distinct=True),
            active_project_count=Count(
                "projects",
                filter=Q(projects__status=Project.Status.IN_PROGRESS),
                distinct=True,
            ),
        )
        .order_by("title")[:6]
    )
    program_rows = [
        {
            "name": program.title,
            "projects": program.project_count,
            "active_projects": program.active_project_count,
            "beneficiaries": f"{program.target_beneficiaries:,}",
            "url": reverse("admin:programs_program_change", args=[program.pk]),
        }
        for program in programs
    ]

    recent_donations = []
    for donation in Donation.objects.select_related("donor", "campaign").order_by(
        "-created_at"
    )[:7]:
        donor_name = "Anonymous"
        if not donation.is_anonymous and donation.donor:
            donor_name = donation.donor.get_full_name() or donation.donor.email
        recent_donations.append(
            {
                "id": str(donation.pk)[:8].upper(),
                "url": reverse("admin:donations_donation_change", args=[donation.pk]),
                "donor": donor_name,
                "campaign": donation.campaign.title
                if donation.campaign
                else "General fund",
                "status": donation.get_status_display(),
                "status_key": donation.status,
                "amount": _money(donation.amount, donation.currency),
                "date": _short_date(
                    timezone.localtime(donation.created_at), "%b %d, %H:%M"
                ),
            }
        )

    context.update(
        {
            "dashboard_greeting": greeting,
            "dashboard_period": f"{_short_date(period_start, '%b %d')} – {_short_date(today, '%b %d, %Y')}",
            "dashboard_kpis": [
                {
                    "label": "Donations received",
                    "value": _money(current_summary["amount"]),
                    "icon": "volunteer_activism",
                    **_change(current_summary["amount"], previous_summary["amount"]),
                },
                {
                    "label": "Completed donations",
                    "value": f"{current_summary['donations']:,}",
                    "icon": "payments",
                    **_change(
                        current_summary["donations"], previous_summary["donations"]
                    ),
                },
                {
                    "label": "Active programs",
                    "value": f"{Program.objects.filter(status=Program.Status.ACTIVE).count():,}",
                    "icon": "diversity_3",
                    "direction": "flat",
                    "value_note": f"{Project.objects.filter(status=Project.Status.IN_PROGRESS).count()} projects in progress",
                },
                {
                    "label": "Available volunteers",
                    "value": f"{VolunteerProfile.objects.filter(availability=VolunteerProfile.AvailabilityStatus.AVAILABLE).count():,}",
                    "icon": "groups",
                    "direction": "flat",
                    "value_note": f"{User.objects.filter(is_active=True).count()} active users",
                },
            ],
            "donation_chart": json.dumps(donation_chart),
            "donation_chart_options": json.dumps(chart_options),
            "status_rows": status_rows,
            "program_rows": program_rows,
            "recent_donations": recent_donations,
            "published_articles": Article.objects.filter(
                status=Article.Status.PUBLISHED
            ).count(),
            "donations_url": reverse("admin:donations_donation_changelist"),
            "programs_url": reverse("admin:programs_program_changelist"),
            "articles_url": reverse("admin:blogs_article_changelist"),
        }
    )
    return context
