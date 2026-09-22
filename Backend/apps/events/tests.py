from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.events.models import Event


class EventContentSecurityTests(TestCase):
    def test_event_description_is_sanitized_before_storage(self):
        now = timezone.now()
        event = Event.objects.create(
            title="Safe event",
            description=(
                '<p onclick="steal()">Welcome</p>'
                '<script>alert("xss")</script>'
                '<a href="javascript:alert(1)">Bad link</a>'
            ),
            start_date=now,
            end_date=now + timedelta(hours=1),
        )

        self.assertNotIn("<script", event.description)
        self.assertNotIn("onclick", event.description)
        self.assertNotIn("javascript:", event.description)
        self.assertIn("<p>Welcome</p>", event.description)


class EventCategoryAPITests(TestCase):
    def test_list_event_categories(self):
        from rest_framework.test import APIClient
        from apps.events.models import EventCategory

        EventCategory.objects.create(name="Workshops", slug="workshops", is_active=True)
        client = APIClient()
        response = client.get("/api/v1/events/categories/")
        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Workshops")
