from django.db import models
from django_ckeditor_5.fields import CKEditor5Field

from core.models import BaseModel


class Subject(BaseModel):
    """Top-level category: CSE, Web Dev, Data Science, etc."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)  # CSS class or emoji key
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "elearning_subjects"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(BaseModel):
    """A full course within a Subject (e.g. 'Introduction to CSE')."""

    class Difficulty(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="courses"
    )
    import_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        editable=False,
        help_text="Stable identity used by repeatable content imports.",
    )
    instructor = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="taught_courses",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = CKEditor5Field(config_name="hovuca", blank=True)
    thumbnail = models.ImageField(
        upload_to="courses/thumbnails/", null=True, blank=True
    )
    difficulty = models.CharField(
        max_length=15, choices=Difficulty.choices, default=Difficulty.BEGINNER
    )
    estimated_hours = models.PositiveSmallIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    is_free = models.BooleanField(default=True)

    class Meta:
        db_table = "elearning_courses"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def total_enrollments(self):
        return self.enrollments.count()
