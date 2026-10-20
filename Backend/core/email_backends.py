"""Django email backend for Resend's HTTP API."""

import resend
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage


class ResendEmailBackend(BaseEmailBackend):
    """Deliver Django ``EmailMessage`` instances through Resend."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not settings.RESEND_API_KEY:
            raise ImproperlyConfigured("RESEND_API_KEY is required for email delivery.")

    @staticmethod
    def _html_body(message: EmailMessage) -> str | None:
        for alternative in getattr(message, "alternatives", ()):
            content = getattr(alternative, "content", alternative[0])
            mimetype = getattr(alternative, "mimetype", alternative[1])
            if mimetype == "text/html":
                return content
        return None

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        resend.api_key = settings.RESEND_API_KEY
        sent = 0

        for message in email_messages:
            if not message.recipients():
                continue

            payload = {
                "from": message.from_email or settings.DEFAULT_FROM_EMAIL,
                "to": message.to,
                "subject": message.subject,
                "text": message.body,
            }
            html = self._html_body(message)
            if html:
                payload["html"] = html
            if message.cc:
                payload["cc"] = message.cc
            if message.bcc:
                payload["bcc"] = message.bcc
            if message.reply_to:
                payload["reply_to"] = message.reply_to

            try:
                resend.Emails.send(payload)
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise

        return sent
