from django.core.validators import URLValidator
from django.db import models

from core.models import BaseModel
from core.utils.files import parent_named_upload_path


class DonationPaymentSettings(BaseModel):
    """Public receiving details; payment credentials must never be stored here."""

    singleton = models.PositiveSmallIntegerField(default=1, unique=True, editable=False)
    bank_name = models.CharField(max_length=200, blank=True)
    account_name = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    iban = models.CharField(max_length=100, blank=True)
    swift_code = models.CharField(max_length=40, blank=True)
    bank_currency = models.CharField(max_length=3, default="XAF")
    bank_instructions = models.TextField(blank=True)
    paypal_url = models.URLField(max_length=1000, blank=True, validators=[URLValidator(schemes=["https"])])
    campay_url = models.URLField(max_length=1000, blank=True, validators=[URLValidator(schemes=["https"])])

    class Meta:
        verbose_name = "Donation payment settings"
        verbose_name_plural = "Donation payment settings"

    def save(self, *args, **kwargs):
        self.singleton = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Donation payment settings"


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
    slug = models.SlugField(unique=True, max_length=280)
    description = models.TextField(blank=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    banner = models.ImageField(
        upload_to=parent_named_upload_path("campaigns", "banner"),
        null=True,
        blank=True,
    )

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
