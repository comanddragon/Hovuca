from django.db import models
from core.models import BaseModel


class Module(BaseModel):
    """
    A module groups related chapters (e.g. 'Module 1: Fundamentals').
    Modules are ordered within a course.
    """

    course = models.ForeignKey(
        "elearning.Course",
        on_delete=models.CASCADE,
        related_name="modules",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    # Audience filtering: modules covering the same course can target different
    # age bands (e.g. two "Relationship" modules, one per band). age_max=None
    # means "no upper bound" (e.g. 15 and above).
    age_min = models.PositiveSmallIntegerField(default=10)
    age_max = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        db_table = "elearning_modules"
        ordering = ["order"]
        unique_together = [("course", "order")]

    def __str__(self):
        return f"{self.course.title} / {self.title}"