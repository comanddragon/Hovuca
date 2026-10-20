"""
Django tasks for the elearning app.
Queues: certificates, accounts
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
    default_retry_delay=30,
    queue="certificates",
    name="elearning.generate_certificate",
)
def generate_certificate(self, enrollment_id: str):
    """
    Generate and store a PDF completion certificate for a finished enrollment.
    Triggered by: ChapterViewSet.complete() when course reaches 100%.
    """
    from apps.elearning.models.enrollment import Enrollment

    try:
        enrollment = Enrollment.objects.select_related("user", "course").get(
            id=enrollment_id
        )
    except Enrollment.DoesNotExist:
        logger.warning("generate_certificate: Enrollment %s not found.", enrollment_id)
        return

    if not enrollment.is_completed:
        logger.info(
            "generate_certificate: Enrollment %s not yet completed — skipping.",
            enrollment_id,
        )
        return

    if enrollment.certificate_issued:
        logger.info(
            "generate_certificate: Certificate already issued for enrollment %s.",
            enrollment_id,
        )
        return

    try:
        # Build a placeholder certificate URL.
        # Replace this block with your PDF generation library (e.g. WeasyPrint / ReportLab).
        cert_filename = f"certificate_{enrollment.user.id}_{enrollment.course.id}.pdf"
        certificate_url = f"/media/certificates/{cert_filename}"

        enrollment.certificate_issued = True
        enrollment.certificate_url = certificate_url
        enrollment.save(update_fields=["certificate_issued", "certificate_url"])

        logger.info(
            "Certificate issued for user=%s course='%s'",
            enrollment.user.email,
            enrollment.course.title,
        )

        # Notify the student
        from apps.notifications.tasks import send_notification

        send_notification.enqueue(
            user_id=str(enrollment.user.id),
            notification_type="course",
            title="🎓 Certificate Ready!",
            body=f"Your certificate for '{enrollment.course.title}' is ready to download.",
            action_url=certificate_url,
        )

        # Email the certificate
        send_certificate_email.enqueue(enrollment_id)

    except Exception as exc:
        logger.error(
            "generate_certificate failed for enrollment %s: %s", enrollment_id, exc
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="elearning.send_certificate_email",
)
def send_certificate_email(self, enrollment_id: str):
    """
    Email the completion certificate to the student.
    Triggered by: generate_certificate task.
    """
    from apps.elearning.models.enrollment import Enrollment

    try:
        enrollment = Enrollment.objects.select_related("user", "course").get(
            id=enrollment_id
        )
    except Enrollment.DoesNotExist:
        return

    try:
        certificate_url = enrollment.certificate_url
        if certificate_url and not certificate_url.startswith(("http://", "https://")):
            certificate_url = (
                f"{getattr(settings, 'BACKEND_URL', 'https://api.hovuca.org')}"
                f"{certificate_url if certificate_url.startswith('/') else f'/{certificate_url}'}"
            )
        context = {
            "user": enrollment.user,
            "course": enrollment.course,
            "certificate_url": certificate_url,
            "completed_at": enrollment.completed_at,
            "frontend_url": getattr(settings, "FRONTEND_URL", "https://hovuca.org"),
        }
        html_message = render_to_string("accounts/elearning/certificate.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"🎓 Your certificate for {enrollment.course.title}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[enrollment.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info("Certificate email sent to %s", enrollment.user.email)

    except Exception as exc:
        logger.error(
            "send_certificate_email failed for enrollment %s: %s", enrollment_id, exc
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="elearning.send_enrollment_confirmation",
)
def send_enrollment_confirmation(self, enrollment_id: str):
    """
    Send a 'you are enrolled' confirmation email.
    Triggered by: Enrollment post_save signal.
    """
    from apps.elearning.models.enrollment import Enrollment

    try:
        enrollment = Enrollment.objects.select_related("user", "course__subject").get(
            id=enrollment_id
        )
    except Enrollment.DoesNotExist:
        return

    try:
        context = {
            "user": enrollment.user,
            "course": enrollment.course,
            "frontend_url": getattr(settings, "FRONTEND_URL", "https://hovuca.org"),
        }
        html_message = render_to_string(
            "accounts/elearning/enrollment_confirmation.html", context
        )
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"You're enrolled in {enrollment.course.title}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[enrollment.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            "Enrollment confirmation sent to %s for course '%s'",
            enrollment.user.email,
            enrollment.course.title,
        )

    except Exception as exc:
        logger.error(
            "send_enrollment_confirmation failed for enrollment %s: %s",
            enrollment_id,
            exc,
        )
        raise self.retry(exc=exc)


@shared_task(
    queue="accounts",
    name="elearning.send_course_completion_email",
)
def send_course_completion_email(enrollment_id: str):
    """
    Notify the student that they have completed a course.
    Triggered by: Enrollment post_save signal on completed_at being set.
    """
    from apps.elearning.models.enrollment import Enrollment

    try:
        enrollment = Enrollment.objects.select_related("user", "course").get(
            id=enrollment_id
        )
    except Enrollment.DoesNotExist:
        return

    try:
        context = {
            "user": enrollment.user,
            "course": enrollment.course,
            "frontend_url": getattr(settings, "FRONTEND_URL", "https://hovuca.org"),
        }
        html_message = render_to_string(
            "accounts/elearning/course_completed.html", context
        )
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"🏆 You completed {enrollment.course.title}!",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[enrollment.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info("Course completion email sent to %s", enrollment.user.email)

    except Exception as exc:
        logger.error(
            "send_course_completion_email failed for %s: %s", enrollment_id, exc
        )


@shared_task(
    queue="default",
    name="elearning.notify_quiz_leaderboard_update",
)
def notify_quiz_leaderboard_update(quiz_id: str):
    """
    Push a real-time leaderboard refresh to all participants connected
    to the quiz WebSocket room.
    Triggered by: QuizAttempt post_save signal.
    """
    from asgiref.sync import async_to_sync
    from apps.realtime.consumers.quiz import QuizConsumer

    try:
        async_to_sync(QuizConsumer.broadcast_leaderboard_update)(quiz_id)
        logger.debug("Leaderboard update broadcast for quiz %s", quiz_id)
    except Exception as exc:
        logger.error(
            "notify_quiz_leaderboard_update failed for quiz %s: %s", quiz_id, exc
        )
