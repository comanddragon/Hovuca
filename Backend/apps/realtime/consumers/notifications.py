"""
NotificationConsumer
====================
WebSocket endpoint: /ws/notifications/

Each authenticated user joins their own private channel group:
    notification_<user_id>

Django tasks (or any Django code) can push notifications to a user
by calling the class-method `NotificationConsumer.push()` or by
publishing directly to the channel layer group:

    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notification_{user_id}",
        {
            "type": "notify",          # maps to self.notify()
            "payload": { ... },
        }
    )

Message types sent to the client:
    { "type": "notification", "data": { ...notification fields... } }
    { "type": "unread_count",  "count": <int> }
    { "type": "error",         "message": "..." }

Messages accepted from the client:
    { "action": "mark_read",     "notification_id": "<uuid>" }
    { "action": "mark_all_read" }
    { "action": "ping" }           → responds with { "type": "pong" }
"""

import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = str(user.id)
        self.group_name = f"notification_{self.user_id}"

        # Join personal group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Immediately push the current unread count on connect
        count = await self._get_unread_count()
        await self.send_json({"type": "unread_count", "count": count})

        logger.debug("NotificationConsumer connected: user=%s", self.user_id)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.debug(
            "NotificationConsumer disconnected: user=%s code=%s",
            getattr(self, "user_id", "?"),
            close_code,
        )

    # ------------------------------------------------------------------
    # Client → Server messages
    # ------------------------------------------------------------------

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            await self.send_json({"type": "error", "message": "Invalid JSON."})
            return

        action = data.get("action")

        if action == "ping":
            await self.send_json({"type": "pong"})

        elif action == "mark_read":
            notification_id = data.get("notification_id")
            if not notification_id:
                await self.send_json(
                    {"type": "error", "message": "notification_id required."}
                )
                return
            success = await self._mark_read(notification_id)
            if success:
                count = await self._get_unread_count()
                await self.send_json({"type": "unread_count", "count": count})
            else:
                await self.send_json(
                    {"type": "error", "message": "Notification not found."}
                )

        elif action == "mark_all_read":
            await self._mark_all_read()
            await self.send_json({"type": "unread_count", "count": 0})

        else:
            await self.send_json(
                {"type": "error", "message": f"Unknown action: {action!r}"}
            )

    # ------------------------------------------------------------------
    # Channel layer → Consumer handlers  (group_send "type" field)
    # ------------------------------------------------------------------

    async def notify(self, event):
        """
        Triggered by: channel_layer.group_send(..., {"type": "notify", "payload": {...}})
        Forwards the notification payload to the WebSocket client.
        """
        await self.send_json({"type": "notification", "data": event["payload"]})

        # Update unread count after delivery
        count = await self._get_unread_count()
        await self.send_json({"type": "unread_count", "count": count})

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))

    @database_sync_to_async
    def _get_unread_count(self):
        from apps.notifications.models import Notification

        return Notification.objects.filter(
            recipient_id=self.user_id,
            is_read=False,
            deleted_at__isnull=True,
        ).count()

    @database_sync_to_async
    def _mark_read(self, notification_id: str) -> bool:
        from django.utils import timezone
        from apps.notifications.models import Notification

        updated = Notification.objects.filter(
            id=notification_id,
            recipient_id=self.user_id,
            deleted_at__isnull=True,
        ).update(is_read=True, read_at=timezone.now())
        return updated > 0

    @database_sync_to_async
    def _mark_all_read(self):
        from django.utils import timezone
        from apps.notifications.models import Notification

        Notification.objects.filter(
            recipient_id=self.user_id,
            is_read=False,
            deleted_at__isnull=True,
        ).update(is_read=True, read_at=timezone.now())

    # ------------------------------------------------------------------
    # Class-level push helper (call from Django tasks / views)
    # ------------------------------------------------------------------

    @classmethod
    async def push(cls, user_id: str, payload: dict):
        """
        Push a notification to a connected user from anywhere in the codebase.

        Usage (sync context, e.g. in a Django task):
            from asgiref.sync import async_to_sync
            async_to_sync(NotificationConsumer.push)(str(user.id), {"title": "Hello"})
        """
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"notification_{user_id}",
            {"type": "notify", "payload": payload},
        )
