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
    evidence_type = models.CharField(
        max_length=20, blank=True,
        choices=[("proposal", "Funding proposal"), ("plan", "Implementation plan"), ("research", "Research report")],
    )
    source_year = models.PositiveSmallIntegerField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    reporting_period = models.CharField(max_length=255, blank=True)
    source_documents = models.JSONField(default=list, blank=True)
    evidence_notes = models.TextField(blank=True)
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


class ProjectActivity(BaseModel):
    """An archived activity; a descriptive period does not imply a scheduled event."""

    class EvidenceStatus(models.TextChoices):
        PLANNED = "planned", "Planned in source"
        REPORTED = "reported", "Reported in source"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="activities")
    slug = models.SlugField(max_length=280)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    period = models.CharField(max_length=255, blank=True)
    evidence_status = models.CharField(max_length=20, choices=EvidenceStatus.choices, default=EvidenceStatus.PLANNED)
    source_documents = models.JSONField(default=list, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "project_activities"
        ordering = ["order", "title"]
        constraints = [models.UniqueConstraint(fields=["project", "slug"], name="unique_project_activity_slug")]

    def __str__(self):
        return f"{self.project.title} / {self.title}"
