from unittest.mock import patch

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.organization.models import ContactMessage
from apps.organization.tasks import send_contact_message_email


class ContactMessageTests(APITestCase):
    def setUp(self):
        self.url = reverse("contact-message-create")
        self.payload = {
            "full_name": "Test Enquirer", "email": "enquirer@example.com",
            "phone": "", "topic": "partnership", "subject": "Partnership enquiry",
            "message": "I would like to discuss a community partnership.",
            "contact_consent": True,
        }

    @patch("apps.organization.tasks.send_contact_message_email")
    def test_guest_submission_is_saved_and_email_is_enqueued(
        self, email_task
    ):
        response = self.client.post(self.url, {**self.payload, "status": "resolved"}, format="json")
        self.assertEqual(response.status_code, 201)
        message = ContactMessage.objects.get(pk=response.data["id"])
        self.assertEqual(message.message, self.payload["message"])
        self.assertEqual(message.status, "new")
        self.assertEqual(set(response.data), {"id", "status"})
        email_task.enqueue.assert_called_once_with(str(message.id))

    @patch("apps.organization.tasks.send_contact_message_email")
    def test_submission_succeeds_when_email_cannot_be_enqueued(self, email_task):
        email_task.enqueue.side_effect = RuntimeError("Email service unavailable")

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertTrue(ContactMessage.objects.filter(pk=response.data["id"]).exists())

    def test_invalid_data_is_not_saved(self):
        response = self.client.post(self.url, {**self.payload, "full_name": " ", "email": "invalid", "topic": "unknown", "message": " "}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue({"full_name", "email", "topic", "message"}.issubset(response.data))
        self.assertFalse(ContactMessage.objects.exists())

    def test_consent_must_be_present_and_true(self):
        for consent in (None, False):
            payload = dict(self.payload)
            if consent is None:
                payload.pop("contact_consent")
            else:
                payload["contact_consent"] = consent
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn("contact_consent", response.data)
        self.assertFalse(ContactMessage.objects.exists())

    def test_phone_must_contain_digits(self):
        response = self.client.post(self.url, {**self.payload, "phone": "......"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)

    def test_guest_cannot_list_messages(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)

    @override_settings(
        DEFAULT_FROM_EMAIL="HOVUCA <noreply@hovuca.org>",
        CONTACT_FORM_RECIPIENT="contact@hovuca.org",
    )
    def test_email_is_sent_to_contact_address_with_enquirer_as_reply_to(self):
        message = ContactMessage.objects.create(**self.payload)

        send_contact_message_email.call(str(message.id))

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ["contact@hovuca.org"])
        self.assertEqual(email.reply_to, [self.payload["email"]])
        self.assertEqual(email.subject, "Contact form: Partnership enquiry")
        html = email.alternatives[0].content
        self.assertIn("Test Enquirer", html)
        self.assertIn(self.payload["message"], html)
