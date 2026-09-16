from django.urls import reverse
from rest_framework.test import APITestCase

from apps.organization.models import ContactMessage


class ContactMessageTests(APITestCase):
    def setUp(self):
        self.url = reverse("contact-message-create")
        self.payload = {
            "full_name": "Test Enquirer", "email": "enquirer@example.com",
            "phone": "", "topic": "partnership", "subject": "Partnership enquiry",
            "message": "I would like to discuss a community partnership.",
            "contact_consent": True,
        }

    def test_guest_submission_is_saved_and_status_cannot_be_injected(self):
        response = self.client.post(self.url, {**self.payload, "status": "resolved"}, format="json")
        self.assertEqual(response.status_code, 201)
        message = ContactMessage.objects.get(pk=response.data["id"])
        self.assertEqual(message.message, self.payload["message"])
        self.assertEqual(message.status, "new")
        self.assertEqual(set(response.data), {"id", "status"})

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
