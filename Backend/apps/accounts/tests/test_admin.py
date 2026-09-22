from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User


class UserAdminTests(TestCase):
    @patch("apps.accounts.tasks.send_email_verification")
    @patch("apps.notifications.tasks.send_notification")
    def test_user_change_page_is_editable_and_includes_birthday(self, notification_task, verification_task):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="A-secure-admin-password-2026!",
            first_name="Admin",
            last_name="User",
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin:accounts_user_change", args=[user.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'name="date_of_birth"')
        self.assertContains(response, "Password")
