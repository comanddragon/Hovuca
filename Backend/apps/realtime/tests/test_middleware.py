from django.core.cache import cache
from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.realtime.middleware import get_user_from_ticket


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "websocket-ticket-tests",
        }
    }
)
class WebSocketTicketTests(TestCase):
    def test_ticket_can_only_be_used_once(self):
        user = User.objects.create_user(
            email="socket@example.com",
            password="A-secure-test-password-2026!",
        )
        cache.set("websocket-ticket:one-use", str(user.pk), 30)

        first = get_user_from_ticket.func("one-use")
        second = get_user_from_ticket.func("one-use")

        self.assertEqual(first, user)
        self.assertFalse(second.is_authenticated)
