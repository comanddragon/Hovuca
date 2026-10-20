from django.urls import reverse
from rest_framework.test import APITestCase

from apps.volunteers.models import VolunteerApplication


class VolunteerApplicationTests(APITestCase):
    def setUp(self):
        self.url = reverse("volunteer-application-create")
        self.payload = {
            "full_name": "Test Applicant",
            "email": "applicant@example.com",
            "phone": "+237 600 000 000",
            "location": "Yaounde, Cameroon",
            "occupation": "Student",
            "skills": "Writing and mentoring",
            "interests": "Learning and mentorship",
            "availability": "Weekends",
            "hours_per_week": 4,
            "motivation": "I would like to support community learning.",
            "contact_consent": True,
        }

    def test_guest_can_submit_and_application_is_pending(self):
        response = self.client.post(self.url, {**self.payload, "status": "accepted"}, format="json")
        self.assertEqual(response.status_code, 201)
        application = VolunteerApplication.objects.get(pk=response.data["id"])
        self.assertEqual(application.email, self.payload["email"])
        self.assertEqual(application.status, "pending")
        self.assertEqual(set(response.data), {"id", "status"})

    def test_invalid_fields_do_not_create_an_application(self):
        response = self.client.post(self.url, {
            **self.payload, "email": "invalid", "hours_per_week": 169, "full_name": " ",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue({"email", "hours_per_week", "full_name"}.issubset(response.data))
        self.assertFalse(VolunteerApplication.objects.exists())

    def test_contact_consent_is_required(self):
        for consent in (None, False):
            payload = dict(self.payload)
            if consent is None:
                payload.pop("contact_consent")
            else:
                payload["contact_consent"] = consent
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn("contact_consent", response.data)
        self.assertFalse(VolunteerApplication.objects.exists())

    def test_phone_number_must_include_digits(self):
        response = self.client.post(self.url, {**self.payload, "phone": "......"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)
        self.assertFalse(VolunteerApplication.objects.exists())

    def test_applications_cannot_be_listed_publicly(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)
