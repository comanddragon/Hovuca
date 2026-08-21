from django.db import models
from apps.core.models import BaseModel


class VolunteerProfile(BaseModel):
    """Extended profile for users with the 'volunteer' role."""

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        BUSY = "busy", "Busy"
        INACTIVE = "inactive", "Inactive"

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="volunteer_profile",
    )
    bio = models.TextField(blank=True)
    skills = models.JSONField(
        default=list, blank=True
    )  # ["Python", "Fundraising", ...]
    availability = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
    )
    hours_contributed = models.PositiveIntegerField(default=0)
    department = models.ForeignKey(
        "organization.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="volunteers",
    )

    class Meta:
        db_table = "volunteer_profiles"

    def __str__(self):
        return f"Volunteer: {self.user.get_full_name()}"


class VolunteerTask(BaseModel):
    """Task assigned to a volunteer."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    project = models.ForeignKey(
        "programs.Project",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="volunteer_tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    due_date = models.DateField(null=True, blank=True)
    hours_logged = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    class Meta:
        db_table = "volunteer_tasks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} → {self.volunteer.user.get_full_name()}"
