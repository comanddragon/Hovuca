from unittest.mock import patch

from django.test import TestCase

from apps.accounts.models import User


class UserCreatedSignalTests(TestCase):
    @patch("apps.accounts.tasks.send_email_verification")
    @patch("apps.notifications.tasks.send_notification")
    def test_creating_user_does_not_enqueue_verification_without_url(
        self, notification_task, verification_task
    ):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="test-password",
            first_name="Test",
            last_name="Admin",
        )

        notification_task.enqueue.assert_called_once_with(
            user_id=str(user.id),
            notification_type="system",
            title="Welcome to HOVUCA! 🎉",
            body="Hi Test, your account is ready. Explore our courses, programs, and community.",
            action_url="/dashboard/",
        )
        verification_task.enqueue.assert_not_called()
