from unittest.mock import patch

from django.core.mail import EmailMultiAlternatives
from django.test import SimpleTestCase, override_settings

from core.email_backends import ResendEmailBackend


@override_settings(
    RESEND_API_KEY="test-resend-key",
    DEFAULT_FROM_EMAIL="HOVUCA <noreply@hovuca.org>",
)
class ResendEmailBackendTests(SimpleTestCase):
    @patch("core.email_backends.resend.Emails.send")
    def test_sends_django_email_with_html_and_reply_to(self, resend_send):
        message = EmailMultiAlternatives(
            subject="Test subject",
            body="Plain text",
            to=["recipient@example.com"],
            reply_to=["reply@example.com"],
        )
        message.attach_alternative("<p>HTML text</p>", "text/html")

        sent = ResendEmailBackend().send_messages([message])

        self.assertEqual(sent, 1)
        resend_send.assert_called_once_with(
            {
                "from": "HOVUCA <noreply@hovuca.org>",
                "to": ["recipient@example.com"],
                "subject": "Test subject",
                "text": "Plain text",
                "html": "<p>HTML text</p>",
                "reply_to": ["reply@example.com"],
            }
        )

    @patch("core.email_backends.resend.Emails.send", side_effect=RuntimeError)
    def test_honors_fail_silently(self, resend_send):
        message = EmailMultiAlternatives(
            subject="Test subject",
            body="Plain text",
            to=["recipient@example.com"],
        )

        sent = ResendEmailBackend(fail_silently=True).send_messages([message])

        self.assertEqual(sent, 0)
        resend_send.assert_called_once()
