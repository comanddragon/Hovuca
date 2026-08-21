# apps/notifications/signals.py
import logging
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from apps.realtime.consumers import NotificationConsumer

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notification)
def push_notification_to_websocket(sender, instance, created, **kwargs):
    if not created:
        return  # only push on new notifications

    payload = {
        "id": str(instance.id),
        "title": instance.title,
        "body": instance.body,
        "action_url": getattr(instance, "action_url", "") or "",
        "created_at": instance.created_at.isoformat(),
    }

    try:
        async_to_sync(NotificationConsumer.push)(str(instance.recipient_id), payload)
    except Exception:
        logger.exception("Failed to push notification %s over WebSocket", instance.id)