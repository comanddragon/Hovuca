from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


@override_settings(
    AXES_ENABLED=False,
    FRONTEND_URL="https://hovuca.org",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "auth-security-tests",
        }
    },
)
class AuthenticationSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="member@example.com",
            password="A-secure-test-password-2026!",
            first_name="Test",
            last_name="Member",
        )

    def tearDown(self):
        cache.clear()

    @patch("apps.accounts.tasks.send_welcome_email")
    def test_public_registration_cannot_choose_privileged_role(self, welcome_task):
        response = self.client.post(
            reverse("register"),
            {
                "email": "attacker@example.com",
                "first_name": "Public",
                "last_name": "User",
                "role": "admin",
                "password": "Another-secure-password-2026!",
                "password_confirm": "Another-secure-password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="attacker@example.com")
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_login_is_rate_limited_after_repeated_failures(self):
        payload = {"email": self.user.email, "password": "wrong-password"}

        for _ in range(5):
            response = self.client.post(reverse("login"), payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(reverse("login"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_websocket_ticket_is_short_lived_and_contains_no_jwt(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse("websocket-ticket"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["expires_in"], 30)
        self.assertNotIn(".", response.data["ticket"])
        self.assertEqual(
            cache.get(f"websocket-ticket:{response.data['ticket']}"),
            str(self.user.pk),
        )

    @patch("apps.accounts.tasks.send_password_reset_email")
    def test_password_reset_link_uses_configured_frontend(self, email_task):
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {"email": self.user.email},
            format="json",
            HTTP_ORIGIN="https://attacker.example",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reset_url = email_task.enqueue.call_args.args[1]
        self.assertTrue(reset_url.startswith("https://hovuca.org/reset-password/"))
        self.assertNotIn("attacker.example", reset_url)


@override_settings(
    AXES_ENABLED=True,
    AXES_FAILURE_LIMIT=3,
    AXES_COOLOFF_TIME=timedelta(minutes=30),
)
class AdminLockoutTests(APITestCase):
    def test_admin_login_locks_after_repeated_failures(self):
        User.objects.create_superuser(
            email="admin@example.com",
            password="A-secure-admin-password-2026!",
            first_name="Test",
            last_name="Admin",
        )

        for _ in range(2):
            self.client.post(
                reverse("admin:login"),
                {"username": "admin@example.com", "password": "incorrect"},
            )

        response = self.client.post(
            reverse("admin:login"),
            {"username": "admin@example.com", "password": "incorrect"},
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
