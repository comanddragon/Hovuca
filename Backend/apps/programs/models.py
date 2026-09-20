from django.db import models

from core.models import BaseModel
from core.utils.files import parent_named_upload_path


class Topic(BaseModel):
    """A public issue area addressed by HOVUCA, optionally nested under another topic."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    source_url = models.CharField(max_length=500, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "topics"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Program(BaseModel):
    """A high-level NGO initiative (e.g. Digital Literacy, Health Outreach)."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organization.Organization",
        on_delete=models.CASCADE,
        related_name="programs",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    excerpt = models.TextField(
        max_length=500, blank=True, help_text="Short summary shown in listing cards."
    )
    description = models.TextField(blank=True)
    banner = models.ImageField(
        upload_to=parent_named_upload_path("programs/banners", "banner"),
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    target_beneficiaries = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "programs"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Project(BaseModel):
    """A concrete project under a Program."""

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ON_HOLD = "on_hold", "On Hold"

    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name="projects"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280)
    excerpt = models.TextField(
        max_length=500, blank=True, help_text="Short summary shown in listing cards."
    )
    description = models.TextField(blank=True)
    cover_image = models.ImageField(
        upload_to=parent_named_upload_path("projects/covers", "cover"),
        null=True,
        blank=True,
    )
    cover_image_alt = models.CharField(max_length=255, blank=True)
    lead = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="led_projects",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNING
    )
    progress_percentage = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "projects"
        unique_together = [("program", "slug")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.program.title} / {self.title}"
