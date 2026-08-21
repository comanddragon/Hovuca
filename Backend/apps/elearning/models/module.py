from django.db import models
from apps.core.models import BaseModel


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

    class Meta:
        db_table = "elearning_modules"
        ordering = ["order"]
        unique_together = [("course", "order")]

    def __str__(self):
        return f"{self.course.title} / {self.title}"
