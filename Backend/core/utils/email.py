"""
Email utility helpers used across all apps.
Wraps Django's send_mail with template rendering and error handling.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_templated_email(
    subject: str,
    template: str,
    context: dict,
    recipient_list: list[str],
    from_email: str | None = None,
    fail_silently: bool = False,
) -> bool:
    """
    Render an HTML email template and send it with a plain-text fallback.

    Args:
        subject:        Email subject line.
        template:       Path to HTML template, e.g. 'accounts/accounts/welcome.html'.
        context:        Template context dict.
        recipient_list: List of recipient email addresses.
        from_email:     Sender address (defaults to DEFAULT_FROM_EMAIL).
        fail_silently:  If True, swallow exceptions and return False.

    Returns:
        True on success, False on failure.
    """
    from_email = from_email or settings.DEFAULT_FROM_EMAIL

    try:
        html_content = render_to_string(template, context)
        plain_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_content,
            from_email=from_email,
            to=recipient_list,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=fail_silently)
        logger.debug(
            "Email sent: subject='%s' recipient_count=%d", subject, len(recipient_list)
        )
        return True

    except Exception as exc:
        logger.error(
            "send_templated_email failed: subject='%s' recipient_count=%d error=%s",
            subject,
            len(recipient_list),
            exc,
        )
        if not fail_silently:
            raise
        return False


def send_plain_email(
    subject: str,
    body: str,
    recipient_list: list[str],
    from_email: str | None = None,
    fail_silently: bool = False,
) -> bool:
    """Send a simple plain-text email without a template."""
    from django.core.mail import send_mail

    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=fail_silently,
        )
        return True
    except Exception as exc:
        logger.error("send_plain_email failed: subject='%s' error=%s", subject, exc)
        if not fail_silently:
            raise
        return False
