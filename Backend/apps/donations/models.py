from django.db import models
from core.models import BaseModel


class DonationCampaign(BaseModel):
    """A fundraising campaign tied to a program or project."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        DRAFT = "draft", "Draft"

    program = models.ForeignKey(
        "programs.Program",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="campaigns",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    banner = models.ImageField(upload_to="campaigns/", null=True, blank=True)

    class Meta:
        db_table = "donation_campaigns"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def progress_percentage(self):
        if self.goal_amount:
            return round((self.raised_amount / self.goal_amount) * 100, 2)
        return 0


class Donation(BaseModel):
    """A single donation transaction."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class Gateway(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYPAL = "paypal", "PayPal"
        MANUAL = "manual", "Manual"

    donor = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="donations",
    )
    campaign = models.ForeignKey(
        DonationCampaign,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="donations",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    gateway = models.CharField(
        max_length=10, choices=Gateway.choices, default=Gateway.STRIPE
    )
    gateway_transaction_id = models.CharField(max_length=255, blank=True, db_index=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    is_anonymous = models.BooleanField(default=False)
    message = models.TextField(blank=True)
    receipt_sent = models.BooleanField(default=False)
    receipt_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "donations"
        ordering = ["-created_at"]

    def __str__(self):
        donor = "Anonymous" if self.is_anonymous else str(self.donor)
        return f"{donor} — {self.amount} {self.currency}"
