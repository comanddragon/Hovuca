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
