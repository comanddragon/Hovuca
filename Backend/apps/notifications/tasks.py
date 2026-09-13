"""
Django tasks for the notifications app.
These are the shared helpers all other apps call to dispatch notifications.
Queue: default
"""

import logging

from core.tasking import shared_task
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


@shared_task(
    queue="default",
    name="notifications.send_notification",
)
def send_notification(
    user_id: str,
    notification_type: str,
    title: str,
    body: str,
    action_url: str = "",
    object_id: str = None,
    content_type_id: int = None,
):
    """
    Create a Notification record and push it to the user's WebSocket connection.
    Used by all apps as the single entry-point for in-app notifications.
    """
    from apps.accounts.models import User
    from apps.notifications.models import Notification

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("send_notification: User %s not found.", user_id)
        return

    try:
        notification = Notification.objects.create(
            recipient=user,
            notification_type=notification_type,
            title=title,
            body=body,
            action_url=action_url,
            object_id=object_id,
        )

        # Real-time push via WebSocket channel layer
        payload = {
            "id": str(notification.id),
            "type": notification_type,
            "title": title,
            "body": body,
            "action_url": action_url,
            "is_read": False,
            "created_at": notification.created_at.isoformat(),
        }

        from apps.realtime.consumers.notifications import NotificationConsumer

        async_to_sync(NotificationConsumer.push)(user_id, payload)

        logger.debug(
            "Notification sent to user=%s type=%s title='%s'",
            user_id,
            notification_type,
            title,
        )

    except Exception as exc:
        logger.error("send_notification failed for user %s: %s", user_id, exc)
        raise


@shared_task(
    queue="default",
    name="notifications.notify_staff",
)
def notify_staff(
    notification_type: str,
    title: str,
    body: str,
    action_url: str = "",
):
    """
    Send the same in-app notification to all active admin and staff users.
    Used for platform-wide alerts (new campaign, flagged content, etc.).
    """
    from apps.accounts.models import User

    staff_ids = list(
        User.objects.filter(
            role__in=("admin", "staff"),
            is_active=True,
        ).values_list("id", flat=True)
    )

    for user_id in staff_ids:
        send_notification.enqueue(
            user_id=str(user_id),
            notification_type=notification_type,
            title=title,
            body=body,
            action_url=action_url,
        )

    logger.info("Staff notification queued for %d user(s): '%s'", len(staff_ids), title)


@shared_task(
    queue="default",
    name="notifications.send_bulk_notification",
)
def send_bulk_notification(
    user_ids: list,
    notification_type: str,
    title: str,
    body: str,
    action_url: str = "",
):
    """
    Send the same notification to a list of users (e.g. all course enrollees).
    """
    for user_id in user_ids:
        send_notification.enqueue(
            user_id=str(user_id),
            notification_type=notification_type,
            title=title,
            body=body,
            action_url=action_url,
        )

    logger.info("Bulk notification queued for %d user(s): '%s'", len(user_ids), title)
