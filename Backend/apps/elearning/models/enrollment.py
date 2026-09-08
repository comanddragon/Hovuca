from django.db import models
from django.utils import timezone
from core.models import BaseModel


class Enrollment(BaseModel):
    """Links a user to a course they have enrolled in."""

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(
        "elearning.Course",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Certificate
    certificate_issued = models.BooleanField(default=False)
    certificate_url = models.URLField(blank=True)

    class Meta:
        db_table = "elearning_enrollments"
        unique_together = [("user", "course")]
        ordering = ["-enrolled_at"]

    def __str__(self):
        return f"{self.user.get_full_name()} → {self.course.title}"

    @property
    def is_completed(self):
        return self.completed_at is not None

    @property
    def progress_percentage(self):
        """
        Calculates completion % based on chapters marked as completed
        vs total chapters in the course.
        """
        total = (
            self.course.modules.prefetch_related("chapters")
            .values_list("chapters", flat=True)
            .count()
        )
        if not total:
            return 0
        completed = self.chapter_progresses.filter(completed_at__isnull=False).count()
        return round((completed / total) * 100, 2)

    def mark_complete(self):
        if not self.completed_at:
            self.completed_at = timezone.now()
            self.save(update_fields=["completed_at"])


class ChapterProgress(BaseModel):
    """
    Records when a student finishes a specific Chapter within an Enrollment.
    One row per (enrollment, chapter) pair.
    """

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="chapter_progresses",
    )
    chapter = models.ForeignKey(
        "elearning.Chapter",
        on_delete=models.CASCADE,
        related_name="progress_records",
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "elearning_chapter_progress"
        unique_together = [("enrollment", "chapter")]

    def __str__(self):
        status = "✓" if self.completed_at else "…"
        return f"{status} {self.enrollment.user.get_full_name()} / {self.chapter.title}"

    def mark_complete(self):
        if not self.completed_at:
            self.completed_at = timezone.now()
            self.save(update_fields=["completed_at"])
