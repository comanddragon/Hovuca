import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

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

    email = EmailMultiAlternatives(
        subject=f"Contact form: {message.subject}",
        body=strip_tags(html),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.CONTACT_FORM_RECIPIENT],
        reply_to=[message.email],
    )
    email.attach_alternative(html, "text/html")
    email.send(fail_silently=False)
    logger.info(
        "Contact message %s emailed to %s",
        message.id,
        settings.CONTACT_FORM_RECIPIENT,
    )
