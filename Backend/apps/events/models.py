from django.db import models
from django.utils.text import slugify
from core.models import BaseModel


class EventCategory(BaseModel):
    """Top-level event category (e.g. 'Workshop', 'Fundraiser', 'Community Day')."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, max_length=280)
    description = models.TextField(blank=True)
    color = models.CharField(
        max_length=7, default="#3B82F6", help_text="Hex color for UI badges."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "event_categories"
        verbose_name_plural = "Event Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Event(BaseModel):
    """An organisation event (workshop, fundraiser, community day, etc.)."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    class EventType(models.TextChoices):
        IN_PERSON = "in_person", "In Person"
        ONLINE = "online", "Online"
        HYBRID = "hybrid", "Hybrid"

    # Authorship / ownership
    organizer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organized_events",
    )
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    # Content
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    excerpt = models.TextField(
        max_length=500, blank=True, help_text="Short summary shown in listing cards."
    )
    description = models.TextField(
        blank=True, help_text="Full event description. Supports Markdown / HTML."
    )
    cover_image = models.ImageField(
        upload_to="events/covers/", null=True, blank=True
    )
    cover_image_alt = models.CharField(max_length=255, blank=True)

    # Scheduling
    start_date = models.DateTimeField(db_index=True)
    end_date = models.DateTimeField()

    # Location
    event_type = models.CharField(
        max_length=20, choices=EventType.choices, default=EventType.IN_PERSON
    )
    location_name = models.CharField(
        max_length=255, blank=True, help_text="Venue name (e.g. 'Yaoundé City Hall')."
    )
    location_address = models.TextField(blank=True)
    online_url = models.URLField(
        blank=True, help_text="Meeting link for online/hybrid events."
    )

    # Registration
    is_registration_required = models.BooleanField(default=False)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    max_attendees = models.PositiveIntegerField(
        null=True, blank=True, help_text="Leave blank for unlimited."
    )

    # Publishing
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    is_featured = models.BooleanField(
        default=False, help_text="Pin to homepage / featured section."
    )

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    # Counter (denormalised)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "events"
        ordering = ["start_date"]
        indexes = [
            models.Index(fields=["status", "start_date"]),
            models.Index(fields=["is_featured", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def is_published(self):
        return self.status == self.Status.PUBLISHED

    @property
    def attendee_count(self):
        return self.registrations.filter(
            status=EventRegistration.Status.CONFIRMED,
            deleted_at__isnull=True,
        ).count()

    @property
    def is_full(self):
        if self.max_attendees is None:
            return False
        return self.attendee_count >= self.max_attendees


class EventImage(BaseModel):
    """
    Additional images for an event, used in the hero slideshow.
    The primary cover_image lives on Event itself; these are extras.
    """

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="events/images/")
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Lower numbers appear first in the slideshow.",
    )

    class Meta:
        db_table = "event_images"
        ordering = ["order", "created_at"]
        verbose_name = "Event Image"
        verbose_name_plural = "Event Images"

    def __str__(self):
        return f"Image {self.order} for {self.event.title}"


class EventRegistration(BaseModel):
    """A user registering for an event."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        WAITLISTED = "waitlisted", "Waitlisted"

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="registrations"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="event_registrations",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.CONFIRMED
    )
    notes = models.TextField(blank=True, help_text="Optional note from the registrant.")
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "event_registrations"
        unique_together = [("event", "user")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.get_full_name()} → {self.event.title}"
