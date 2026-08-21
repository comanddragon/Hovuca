from django.db import models
from apps.core.models import BaseModel


class Organization(BaseModel):
    """Top-level NGO profile."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="org/logos/", null=True, blank=True)
    website = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    founded_year = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "organizations"
        verbose_name = "Organization"

    def __str__(self):
        return self.name


class Branch(BaseModel):
    """Regional or campus branch of the NGO."""

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="branches"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    location = models.CharField(max_length=255, blank=True)
    manager = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_branches",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "branches"
        unique_together = [("organization", "slug")]
        verbose_name_plural = "Branches"

    def __str__(self):
        return f"{self.organization.name} — {self.name}"


class Department(BaseModel):
    """Department within a branch (e.g. Tech, Education, Finance)."""

    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="departments"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    head = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="headed_departments",
    )

    class Meta:
        db_table = "departments"
        unique_together = [("branch", "name")]

    def __str__(self):
        return f"{self.branch.name} / {self.name}"
