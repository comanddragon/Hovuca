import logging

import resend
from django.conf import settings
from django.template.loader import render_to_string

from core.tasking import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="organization.send_contact_message_email")
def send_contact_message_email(message_id: str):
    from .models import ContactMessage

    try:
        message = ContactMessage.objects.get(id=message_id)
    except ContactMessage.DoesNotExist:
        logger.warning("Contact message %s no longer exists; skipping email.", message_id)
        return

    html = render_to_string(
        "emails/organization/contact_message.html", {"contact_message": message}
    )

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(
        {
            "from": settings.RESEND_FROM,
            "to": settings.CONTACT_FORM_RECIPIENT,
            "reply_to": message.email,
            "subject": f"Contact form: {message.subject}",
            "html": html,
        }
    )
    logger.info(
        "Contact message %s emailed to %s",
        message.id,
        settings.CONTACT_FORM_RECIPIENT,
    )
