from django.db import models
from apps.core.models import BaseModel


class Chapter(BaseModel):
    """
    An individual lesson/content unit inside a module.
    Content can be a video, rich text body, or a downloadable file.
    """

    class ContentType(models.TextChoices):
        VIDEO = "video", "Video"
        TEXT = "text", "Text / Article"
        PDF = "pdf", "PDF / File"

    module = models.ForeignKey(
        "elearning.Module",
        on_delete=models.CASCADE,
        related_name="chapters",
    )
    title = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField(default=0)
    content_type = models.CharField(
        max_length=10, choices=ContentType.choices, default=ContentType.VIDEO
    )

    # For video: YouTube / Vimeo URL or S3 path
    content_url = models.URLField(blank=True)

    # For text/article content
    content_body = models.TextField(blank=True)

    # For PDF/file
    content_file = models.FileField(upload_to="chapters/files/", null=True, blank=True)

    duration_minutes = models.PositiveSmallIntegerField(default=0)
    is_preview = models.BooleanField(default=False)  # Free preview without enrollment

    class Meta:
        db_table = "elearning_chapters"
        ordering = ["order"]
        unique_together = [("module", "order")]

    def __str__(self):
        return f"{self.module.title} / {self.title}"
