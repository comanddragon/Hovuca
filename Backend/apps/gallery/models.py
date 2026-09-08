from django.db import models
from django.utils.text import slugify
from core.models import BaseModel


class GalleryAlbum(BaseModel):
    """A named collection of gallery images (e.g. 'Community Day 2024')."""

    # Authorship
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_albums",
    )
    # Optional linkage
    event = models.OneToOneField(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_albums",
    )
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_albums",
    )
    project = models.ForeignKey(
        "programs.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_albums",
    )

    # Content
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(
        upload_to="gallery/covers/", null=True, blank=True,
        help_text="If blank, the first image in the album is used as cover.",
    )

    # Publishing
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    taken_at = models.DateField(
        null=True, blank=True,
        help_text="Date photos were taken (for display ordering).",
    )

    class Meta:
        db_table = "gallery_albums"
        ordering = ["-taken_at", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def image_count(self):
        return self.images.filter(deleted_at__isnull=True).count()

    @property
    def effective_cover(self):
        """Return the cover image URL, falling back to the first image."""
        if self.cover_image:
            return self.cover_image
        first = self.images.filter(deleted_at__isnull=True).order_by("order").first()
        return first.image if first else None


class GalleryImage(BaseModel):
    """A single image inside a GalleryAlbum."""

    class MediaType(models.TextChoices):
        PHOTO = "photo", "Photo"
        VIDEO = "video", "Video"

    album = models.ForeignKey(
        GalleryAlbum, on_delete=models.CASCADE, related_name="images"
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gallery_images",
    )

    # Media
    image = models.ImageField(upload_to="gallery/images/%Y/%m/")
    thumbnail = models.ImageField(
        upload_to="gallery/thumbnails/%Y/%m/",
        null=True,
        blank=True,
        help_text="Auto-generated smaller version.",
    )
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.PHOTO
    )

    # Metadata
    title = models.CharField(max_length=255, blank=True)
    caption = models.TextField(blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(
        default=list, blank=True, help_text='["children", "workshop"]'
    )

    # Ordering
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_featured = models.BooleanField(
        default=False, help_text="Highlight in album cover / featured grid."
    )

    # Stats
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "gallery_images"
        ordering = ["order", "created_at"]

    def __str__(self):
        return self.title or f"Image in {self.album.title}"