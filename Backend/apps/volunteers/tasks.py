"""
Django tasks for the volunteers app.
Queue: accounts, default
"""

import logging

from core.tasking import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="volunteers.send_task_assignment_email",
)
def send_task_assignment_email(self, task_id: str):
    """
    Notify a volunteer by email when a new task is assigned to them.
    Triggered by: VolunteerTask post_save signal (created=True).
    """
    from .models import VolunteerTask

    try:
        task = VolunteerTask.objects.select_related(
            "volunteer__user", "project__program"
        ).get(id=task_id)
    except VolunteerTask.DoesNotExist:
        logger.warning("send_task_assignment_email: Task %s not found.", task_id)
        return

    user = task.volunteer.user

    try:
        context = {
            "user": user,
            "task": task,
            "frontend_url": getattr(settings, "FRONTEND_URL", "https://hovuca.org"),
        }
        html_message = render_to_string("accounts/volunteers/task_assigned.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"New task assigned: {task.title}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            "Task assignment email sent to %s for task '%s'", user.email, task.title
        )

    except Exception as exc:
        logger.error("send_task_assignment_email failed for task %s: %s", task_id, exc)
        raise self.retry(exc=exc)


@shared_task(
    queue="default",
    name="volunteers.remind_pending_tasks",
)
def remind_pending_tasks():
    """
    Periodic task: remind volunteers of tasks that are past their due date
    and still pending or in-progress.
    Schedule in a scheduler (e.g. daily at 08:00).
    """
    from django.utils import timezone
    from .models import VolunteerTask

    overdue = VolunteerTask.objects.filter(
        due_date__lt=timezone.now().date(),
        status__in=("pending", "in_progress"),
        deleted_at__isnull=True,
    ).select_related("volunteer__user")

    for task in overdue:
        user = task.volunteer.user
        try:
            from apps.notifications.tasks import send_notification

            send_notification.enqueue(
                user_id=str(user.id),
                notification_type="volunteer",
                title="⏰ Overdue Task",
                body=f"Your task '{task.title}' was due on {task.due_date}. Please update its status.",
                action_url=f"/volunteer-tasks/{task.id}/",
            )
        except Exception as exc:
            logger.error(
                "remind_pending_tasks notification failed for task %s: %s", task.id, exc
            )

    logger.info("Overdue task reminders sent for %d task(s).", overdue.count())


@shared_task(
    queue="default",
    name="volunteers.update_hours_contributed",
)
def update_hours_contributed(volunteer_profile_id: str):
    """
    Recalculate and persist the total hours_contributed for a volunteer
    from all their completed tasks.
    Triggered by: VolunteerTask post_save signal when status=COMPLETED.
    """
    from django.db.models import Sum
    from .models import VolunteerProfile, VolunteerTask

    try:
        profile = VolunteerProfile.objects.get(id=volunteer_profile_id)
    except VolunteerProfile.DoesNotExist:
        return

    total = (
        VolunteerTask.objects.filter(
            volunteer=profile,
            status=VolunteerTask.Status.COMPLETED,
            deleted_at__isnull=True,
        ).aggregate(total=Sum("hours_logged"))["total"]
        or 0
    )

    profile.hours_contributed = int(total)
    profile.save(update_fields=["hours_contributed"])

    logger.info(
        "Updated hours_contributed for volunteer %s: %s hours",
        profile.user.email,
        profile.hours_contributed,
    )
