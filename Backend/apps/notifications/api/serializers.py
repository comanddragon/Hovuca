from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "action_url",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationMarkReadSerializer(serializers.Serializer):
    """Payload to mark one or many notifications as read."""

    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="List of notification UUIDs to mark as read.",
    )


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Internal serializer — used by Django tasks / system events, not exposed to end users."""

    class Meta:
        model = Notification
        fields = [
            "recipient",
            "notification_type",
            "title",
            "body",
            "action_url",
            "content_type",
            "object_id",
        ]
