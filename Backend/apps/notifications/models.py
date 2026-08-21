from django.db import models
from apps.core.models import BaseModel


class Notification(BaseModel):
    """In-app notification for a user."""

    class NotificationType(models.TextChoices):
        SYSTEM = "system", "System"
        COURSE = "course", "Course"
        QUIZ = "quiz", "Quiz"
        DONATION = "donation", "Donation"
        VOLUNTEER = "volunteer", "Volunteer"
        CHAT = "chat", "Chat"

    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(
        max_length=15, choices=NotificationType.choices, default=NotificationType.SYSTEM
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)

    # Generic FK support — optionally link to any object
    content_type = models.ForeignKey(
        "contenttypes.ContentType",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    object_id = models.UUIDField(null=True, blank=True)

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.email}"

    def mark_read(self):
        from django.utils import timezone

        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
