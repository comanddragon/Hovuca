"""
Signals for the volunteers app.
Connected in VolunteersConfig.ready().
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="volunteers.VolunteerTask")
def on_volunteer_task_saved(sender, instance, created, **kwargs):
    """
    When a VolunteerTask is created → send assignment notification + email.
    When a VolunteerTask is completed → update hours_contributed.
    """
    if created:
        # Email the volunteer
        try:
            from .tasks import send_task_assignment_email

            send_task_assignment_email.delay(str(instance.id))
        except Exception as exc:
            logger.error("on_volunteer_task_saved task email dispatch failed: %s", exc)

        # In-app notification
        try:
            from apps.notifications.tasks import send_notification

            send_notification.delay(
                user_id=str(instance.volunteer.user.id),
                notification_type="volunteer",
                title="📋 New Task Assigned",
                body=f"You have been assigned: '{instance.title}'.",
                action_url=f"/volunteer-tasks/{instance.id}/",
            )
        except Exception as exc:
            logger.error(
                "on_volunteer_task_saved notification dispatch failed: %s", exc
            )

    # Recalculate hours whenever a task is saved as completed
    if instance.status == "completed":
        try:
            from .tasks import update_hours_contributed

            update_hours_contributed.delay(str(instance.volunteer.id))
        except Exception as exc:
            logger.error(
                "on_volunteer_task_saved hours update dispatch failed: %s", exc
            )
