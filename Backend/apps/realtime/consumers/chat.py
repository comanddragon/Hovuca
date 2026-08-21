"""
ChatConsumer
============
WebSocket endpoint: /ws/chat/<room_id>/

Supports real-time messaging between authenticated users in a named room.
Each room maps to a Redis channel group: chat_<room_id>

Message types sent to the client:
    { "type": "chat_message",  "message": { ...fields... } }
    { "type": "user_joined",   "user": { "id": ..., "full_name": ... } }
    { "type": "user_left",     "user": { "id": ..., "full_name": ... } }
    { "type": "typing",        "user": { "id": ..., "full_name": ... }, "is_typing": bool }
    { "type": "error",         "message": "..." }

Messages accepted from the client:
    { "action": "send_message", "content": "<text>" }
    { "action": "typing",       "is_typing": true|false }
    { "action": "ping" }
"""

import json
import logging
from datetime import datetime, timezone as dt_timezone

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

# Maximum message length (characters)
MAX_MESSAGE_LENGTH = 2000


class ChatConsumer(AsyncWebsocketConsumer):
    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"chat_{self.room_id}"
        self.user_id = str(user.id)
        self.user_info = {
            "id": self.user_id,
            "full_name": user.get_full_name(),
            "avatar": user.avatar.url if user.avatar else None,
        }

        # Join room group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Announce arrival to room
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "user_joined_event", "user": self.user_info},
        )

        # Send recent message history to the newly connected user
        history = await self._get_recent_messages()
        await self.send_json({"type": "history", "messages": history})

        logger.debug(
            "ChatConsumer connected: user=%s room=%s", self.user_id, self.room_id
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            # Announce departure
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "user_left_event", "user": self.user_info},
            )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        logger.debug(
            "ChatConsumer disconnected: user=%s room=%s code=%s",
            getattr(self, "user_id", "?"),
            getattr(self, "room_id", "?"),
            close_code,
        )

    # ------------------------------------------------------------------
    # Client → Server
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

        elif action == "send_message":
            content = str(data.get("content", "")).strip()
            if not content:
                await self.send_json(
                    {"type": "error", "message": "Message content cannot be empty."}
                )
                return
            if len(content) > MAX_MESSAGE_LENGTH:
                await self.send_json(
                    {
                        "type": "error",
                        "message": f"Message exceeds {MAX_MESSAGE_LENGTH} characters.",
                    }
                )
                return

            message = await self._save_message(content)

            # Broadcast to all room members
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat_message_event", "message": message},
            )

        elif action == "typing":
            is_typing = bool(data.get("is_typing", False))
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "typing_event",
                    "user": self.user_info,
                    "is_typing": is_typing,
                },
            )

        else:
            await self.send_json(
                {"type": "error", "message": f"Unknown action: {action!r}"}
            )

    # ------------------------------------------------------------------
    # Channel layer → Consumer handlers
    # ------------------------------------------------------------------

    async def chat_message_event(self, event):
        await self.send_json({"type": "chat_message", "message": event["message"]})

    async def user_joined_event(self, event):
        # Don't echo back to the joining user themselves
        if event["user"]["id"] != self.user_id:
            await self.send_json({"type": "user_joined", "user": event["user"]})

    async def user_left_event(self, event):
        if event["user"]["id"] != self.user_id:
            await self.send_json({"type": "user_left", "user": event["user"]})

    async def typing_event(self, event):
        # Don't reflect typing indicator back to sender
        if event["user"]["id"] != self.user_id:
            await self.send_json(
                {
                    "type": "typing",
                    "user": event["user"],
                    "is_typing": event["is_typing"],
                }
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content, default=str))

    @database_sync_to_async
    def _save_message(self, content: str) -> dict:
        """
        Persist the chat message and return a serialisable dict.
        Uses the Notification model with type=CHAT as lightweight storage.
        For a production chat feature you would add a dedicated ChatMessage model.
        """
        from apps.notifications.models import Notification
        from apps.accounts.models import User

        sender = User.objects.get(id=self.user_id)
        Notification.objects.create(
            recipient=sender,  # self-addressed; room broadcast handled by channel layer
            notification_type=Notification.NotificationType.CHAT,
            title=f"Room {self.room_id}",
            body=content,
            action_url=f"/chat/{self.room_id}/",
        )

        return {
            "id": None,  # ephemeral — history is kept in Redis / DB separately
            "room_id": self.room_id,
            "sender": self.user_info,
            "content": content,
            "timestamp": datetime.now(dt_timezone.utc).isoformat(),
        }

    @database_sync_to_async
    def _get_recent_messages(self) -> list:
        """
        Return the last 50 messages for this room from the Notification store.
        Replace with a dedicated ChatMessage queryset when you add that model.
        """
        from apps.notifications.models import Notification

        qs = (
            Notification.objects.filter(
                notification_type=Notification.NotificationType.CHAT,
                action_url=f"/chat/{self.room_id}/",
                deleted_at__isnull=True,
            )
            .select_related("recipient")
            .order_by("-created_at")[:50]
        )

        return [
            {
                "sender": {
                    "id": str(n.recipient.id),
                    "full_name": n.recipient.get_full_name(),
                    "avatar": n.recipient.avatar.url if n.recipient.avatar else None,
                },
                "content": n.body,
                "timestamp": n.created_at.isoformat(),
            }
            for n in reversed(list(qs))
        ]
