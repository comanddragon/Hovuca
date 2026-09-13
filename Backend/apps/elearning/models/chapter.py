import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.db import models
from core.models import BaseModel


def sanitize_chapter_body(value: str) -> str:
    return bleach.clean(
        value,
        tags=["p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "code", "pre", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "th", "td"],
        attributes={"a": ["href", "title", "target", "rel"], "img": ["src", "alt", "style", "width", "height"], "td": ["colspan", "rowspan", "style"], "th": ["colspan", "rowspan", "style"], "*": ["class", "data-indent", "style"]},
        css_sanitizer=CSSSanitizer(allowed_css_properties=["width", "height", "margin-left", "margin-right", "float", "background-color", "border-color", "text-align"]),
        strip=True,
    )


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

    def save(self, *args, **kwargs):
        if self.content_body:
            self.content_body = sanitize_chapter_body(self.content_body)
        super().save(*args, **kwargs)
