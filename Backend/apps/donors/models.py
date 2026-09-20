from django.core.validators import MinValueValidator
from django.db import models

from core.models import BaseModel
from core.utils.files import parent_named_upload_path


class DonorOrganization(BaseModel):
    """
    An external organization (foundation, corporation, institution, etc.)
    that has funded this NGO in the past.
    """

    class Type(models.TextChoices):
        FOUNDATION = "foundation", "Foundation"
        CORPORATION = "corporation", "Corporation"
        GOVERNMENT = "government", "Government"
        NGO = "ngo", "NGO / INGO"
        MULTILATERAL = "multilateral", "Multilateral Agency"
        FAITH_BASED = "faith_based", "Faith-Based Organization"
        INDIVIDUAL = "individual", "High-Net-Worth Individual"
        OTHER = "other", "Other"

    class Tier(models.TextChoices):
        PLATINUM = "platinum", "Platinum"   # > 100 000
        GOLD = "gold", "Gold"               # 25 000 – 100 000
        SILVER = "silver", "Silver"         # 5 000 – 24 999
        BRONZE = "bronze", "Bronze"         # < 5 000

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        LAPSED = "lapsed", "Lapsed"         # no grant in 2+ years
        PROSPECT = "prospect", "Prospect"   # potential re-engagement
        INACTIVE = "inactive", "Inactive"

    # Identity
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, max_length=280)
    abbreviation = models.CharField(max_length=30, blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.FOUNDATION)
    logo = models.ImageField(
        upload_to=parent_named_upload_path("donors/logos", "logo"),
        null=True,
        blank=True,
    )
    description = models.TextField(blank=True)

    # Contact
    website = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)

    # Location
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)

    # Classification
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.BRONZE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    focus_areas = models.JSONField(
        default=list, blank=True,
        help_text='List of thematic areas, e.g. ["Education", "Health"]'
    )

    # Relationship tracking
    relationship_owner = models.ForeignKey(
        "accounts.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_donor_orgs",
        help_text="Staff member responsible for this donor relationship.",
    )
    first_funded_at = models.DateField(
        null=True, blank=True,
        help_text="Date of first grant/funding received."
    )
    last_funded_at = models.DateField(
        null=True, blank=True,
        help_text="Date of most recent grant/funding received."
    )

    # Financials (denormalised for quick display)
    total_funded = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        help_text="Total amount ever received from this donor (auto-updated)."
    )
    currency = models.CharField(max_length=3, default="USD")

    # Preferences
    prefers_anonymous = models.BooleanField(default=False)
    notes = models.TextField(blank=True, help_text="Internal notes (not public).")

    class Meta:
        db_table = "donor_organizations"
        ordering = ["-total_funded", "name"]
        indexes = [
            models.Index(fields=["status", "tier"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        from django.utils.text import slugify
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        """Recompute total_funded, first_funded_at, last_funded_at from grants."""
        from django.db.models import Max, Min, Sum
        grants = self.grants.filter(deleted_at__isnull=True, status=Grant.Status.COMPLETED)
        agg = grants.aggregate(
            total=Sum("amount"),
            first=Min("disbursed_date"),
            last=Max("disbursed_date"),
        )
        self.total_funded = agg["total"] or 0
        self.first_funded_at = agg["first"]
        self.last_funded_at = agg["last"]
        self.save(update_fields=["total_funded", "first_funded_at", "last_funded_at"])


class DonorContact(BaseModel):
    """
    A named individual contact within a DonorOrganization
    (e.g. programme officer, grants manager).
    """

    class Role(models.TextChoices):
        PROGRAMME_OFFICER = "programme_officer", "Programme Officer"
        GRANTS_MANAGER = "grants_manager", "Grants Manager"
        EXECUTIVE = "executive", "Executive / Director"
        FINANCE = "finance", "Finance Officer"
        OTHER = "other", "Other"

    organization = models.ForeignKey(
        DonorOrganization, on_delete=models.CASCADE, related_name="contacts"
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OTHER)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary contact for this organization."
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "donor_contacts"
        ordering = ["-is_primary", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.organization.name})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Grant(BaseModel):
    """
    A specific funding grant received from a DonorOrganization.
    Linked optionally to a Program or Project.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class FundingType(models.TextChoices):
        PROJECT = "project", "Project-Based"
        OPERATIONAL = "operational", "Operational / General"
        CAPACITY = "capacity", "Capacity Building"
        EMERGENCY = "emergency", "Emergency"
        RESEARCH = "research", "Research"
        OTHER = "other", "Other"

    donor_organization = models.ForeignKey(
        DonorOrganization, on_delete=models.CASCADE, related_name="grants"
    )
    program = models.ForeignKey(
        "programs.Program",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="donor_grants",
    )
    project = models.ForeignKey(
        "programs.Project",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="donor_grants",
    )
    campaign = models.ForeignKey(
        "donations.DonationCampaign",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="donor_grants",
    )

    # Grant details
    reference_code = models.CharField(
        max_length=100, blank=True, db_index=True,
        help_text="Internal or donor-assigned grant reference number."
    )
    title = models.CharField(max_length=255)
    funding_type = models.CharField(
        max_length=15, choices=FundingType.choices, default=FundingType.PROJECT
    )
    amount = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    # Timeline
    agreement_date = models.DateField(null=True, blank=True)
    disbursed_date = models.DateField(
        null=True, blank=True,
        help_text="Date funds were actually received."
    )
    reporting_deadline = models.DateField(null=True, blank=True)

    # Documents / reporting
    agreement_document = models.FileField(
        upload_to=parent_named_upload_path("donors/agreements", "agreement"),
        null=True,
        blank=True,
    )
    report_submitted = models.BooleanField(default=False)
    report_submitted_at = models.DateTimeField(null=True, blank=True)

    # Contact who arranged this grant
    contact = models.ForeignKey(
        DonorContact,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="grants",
    )
    internal_owner = models.ForeignKey(
        "accounts.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_grants",
        help_text="Staff member who manages this grant internally.",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "donor_grants"
        ordering = ["-disbursed_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "disbursed_date"]),
            models.Index(fields=["donor_organization", "status"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.donor_organization.name} ({self.amount} {self.currency})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Keep donor totals in sync whenever a grant changes
        try:
            self.donor_organization.recalculate_totals()
        except Exception:
            pass


class DonorEngagement(BaseModel):
    """
    A log of any interaction / touchpoint with a DonorOrganization.
    """

    class EngagementType(models.TextChoices):
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        CALL = "call", "Phone Call"
        REPORT = "report", "Report Submitted"
        VISIT = "visit", "Site Visit"
        EVENT = "event", "Event / Conference"
        PROPOSAL = "proposal", "Proposal Submitted"
        OTHER = "other", "Other"

    organization = models.ForeignKey(
        DonorOrganization, on_delete=models.CASCADE, related_name="engagements"
    )
    contact = models.ForeignKey(
        DonorContact,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="engagements",
    )
    logged_by = models.ForeignKey(
        "accounts.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="donor_engagements",
    )
    grant = models.ForeignKey(
        Grant,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="engagements",
    )
    type = models.CharField(
        max_length=15, choices=EngagementType.choices, default=EngagementType.EMAIL
    )
    date = models.DateField()
    summary = models.TextField(help_text="What was discussed / done.")
    outcome = models.TextField(blank=True, help_text="Result or follow-up needed.")
    next_action = models.TextField(blank=True)
    next_action_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "donor_engagements"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} with {self.organization.name} on {self.date}"
