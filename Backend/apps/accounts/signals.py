"""
Signals for the accounts app.
Connected in AccountsConfig.ready().
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="accounts.User")
def on_user_created(sender, instance, created, **kwargs):
    """
    After a new User is created:
      - Push a system notification welcoming them.
    The welcome *email* is handled by RegisterView so we don't double-send here.
    """
    if not created:
        return

    try:
        from apps.notifications.tasks import send_notification

        send_notification.enqueue(
            user_id=str(instance.id),
            notification_type="system",
            title="Welcome to HOVUCA! 🎉",
            body=(
                f"Hi {instance.first_name}, your account is ready. "
                "Explore our courses, programs, and community."
            ),
            action_url="/dashboard/",
        )
    except Exception as exc:
        logger.error("on_user_created notification failed for %s: %s", instance.id, exc)


@receiver(post_save, sender="accounts.User")
def notify_password_changed(sender, instance, update_fields, **kwargs):
    if update_fields and "password" in (update_fields or []):
        try:
            from apps.accounts.tasks import send_password_changed_email
            # No request context in signals — frontend_url left empty,
            # template footer links fall back to "#"
            send_password_changed_email.enqueue(instance.email)
        except Exception as exc:
            logger.error("notify_password_changed failed for %s: %s", instance.id, exc)
