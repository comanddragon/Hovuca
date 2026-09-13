"""
Django tasks for the accounts app.
Queue: accounts

Email delivery via Resend (HTTP API — fast, no SMTP).
Non-email tasks (IP logging etc.) use the configured Django task backend.
"""

import logging

import resend
from core.tasking import shared_task
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send(*, to: str, subject: str, html: str):
    """Thin wrapper around the Resend API."""
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": settings.RESEND_FROM,
        "to": to,
        "subject": subject,
        "html": html,
    })


# ---------------------------------------------------------------------------
# Welcome email
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="accounts.send_welcome_email",
)
def send_welcome_email(self, user_id: str, frontend_url: str = ""):
    from .models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("send_welcome_email: User %s not found — skipping.", user_id)
        return

    try:
        html = render_to_string("emails/accounts/welcome.html", {
            "user": user,
            "platform_name": "HOVUCA",
            "login_url": f"{frontend_url}/login" if frontend_url else "#",
            "frontend_url": frontend_url,
        })
        _send(to=user.email, subject="Welcome to HOVUCA 🎉", html=html)
        logger.info("Welcome email sent to %s", user.email)

    except Exception as exc:
        logger.error("send_welcome_email failed for %s: %s", user_id, exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Password reset email
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="accounts.send_password_reset_email",
)
def send_password_reset_email(self, user_id: str, reset_url: str):
    from .models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("send_password_reset_email: User %s not found.", user_id)
        return

    try:
        html = render_to_string("emails/accounts/password_reset.html", {
            "user": user,
            "reset_url": reset_url,
            "frontend_url": reset_url.split("/reset-password")[0],
        })
        _send(to=user.email, subject="Reset your HOVUCA password", html=html)
        logger.info("Password reset email sent to %s", user.email)

    except Exception as exc:
        logger.error("send_password_reset_email failed for %s: %s", user_id, exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="accounts.send_email_verification",
)
def send_email_verification(self, user_id: str, verify_url: str):
    from .models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    try:
        html = render_to_string("emails/accounts/email_verification.html", {
            "user": user,
            "verify_url": verify_url,
            "frontend_url": verify_url.split("/verify")[0],
        })
        _send(to=user.email, subject="Verify your HOVUCA email address", html=html)
        logger.info("Verification email sent to %s", user.email)

    except Exception as exc:
        logger.error("send_email_verification failed for %s: %s", user_id, exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Password changed notification
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="accounts.send_password_changed_email",
)
def send_password_changed_email(self, email: str, frontend_url: str = ""):
    try:
        html = render_to_string("emails/accounts/password_changed.html", {
            "frontend_url": frontend_url,
        })
        _send(to=email, subject="Your HOVUCA password was changed", html=html)
        logger.info("Password changed email sent to %s", email)

    except Exception as exc:
        logger.error("send_password_changed_email failed for %s: %s", email, exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Update last login IP (non-email — stays on the task backend)
# ---------------------------------------------------------------------------

@shared_task(queue="accounts", name="accounts.update_last_login_ip")
def update_last_login_ip(user_id: str, ip: str):
    from .models import User
    User.objects.filter(id=user_id).update(last_login_ip=ip)
