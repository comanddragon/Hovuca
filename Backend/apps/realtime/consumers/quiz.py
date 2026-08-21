"""
QuizConsumer
============
WebSocket endpoint: /ws/quiz/<quiz_id>/

Powers two real-time features:
  1. Live leaderboard — pushed to all connected participants whenever
     a new attempt is completed (triggered by Celery / quiz submit view).
  2. Quiz session timer — server-authoritative countdown broadcast to
     all participants in the same quiz room.

Channel group: quiz_<quiz_id>

Message types sent to the client:
    { "type": "leaderboard",    "entries": [ { rank, user, score, passed } ] }
    { "type": "participant_count", "count": <int> }
    { "type": "timer_tick",     "seconds_remaining": <int> }
    { "type": "quiz_ended" }
    { "type": "error",          "message": "..." }

Messages accepted from the client:
    { "action": "ping" }
    { "action": "request_leaderboard" }   → immediate leaderboard push

Publishing a leaderboard update from elsewhere (e.g. quiz submit view):
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    async_to_sync(get_channel_layer().group_send)(
        f"quiz_{quiz_id}",
        {"type": "leaderboard_update", "quiz_id": str(quiz_id)},
    )
"""

import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

# In-memory participant counter per quiz group (process-local; use Redis for multi-process)
_participant_counts: dict[str, int] = {}


class QuizConsumer(AsyncWebsocketConsumer):
    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.quiz_id = self.scope["url_route"]["kwargs"]["quiz_id"]
        self.group_name = f"quiz_{self.quiz_id}"
        self.user_id = str(user.id)
        self.user_info = {
            "id": self.user_id,
            "full_name": user.get_full_name(),
        }

        # Validate quiz exists and is active
        quiz = await self._get_quiz()
        if quiz is None:
            await self.close(code=4004)
            return

        # Join quiz group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Track participant count
        _participant_counts[self.group_name] = (
            _participant_counts.get(self.group_name, 0) + 1
        )
        await self._broadcast_participant_count()

        # Send current leaderboard immediately on connect
        leaderboard = await self._build_leaderboard()
        await self.send_json({"type": "leaderboard", "entries": leaderboard})

        logger.debug(
            "QuizConsumer connected: user=%s quiz=%s", self.user_id, self.quiz_id
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            _participant_counts[self.group_name] = max(
                0, _participant_counts.get(self.group_name, 1) - 1
            )
            await self._broadcast_participant_count()
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        logger.debug(
            "QuizConsumer disconnected: user=%s quiz=%s code=%s",
            getattr(self, "user_id", "?"),
            getattr(self, "quiz_id", "?"),
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

        elif action == "request_leaderboard":
            leaderboard = await self._build_leaderboard()
            await self.send_json({"type": "leaderboard", "entries": leaderboard})

        else:
            await self.send_json(
                {"type": "error", "message": f"Unknown action: {action!r}"}
            )

    # ------------------------------------------------------------------
    # Channel layer → Consumer handlers
    # ------------------------------------------------------------------

    async def leaderboard_update(self, event):
        """
        Triggered when any participant submits an attempt.
        Rebuilds and broadcasts the leaderboard to all connected clients.
        """
        leaderboard = await self._build_leaderboard()
        await self.send_json({"type": "leaderboard", "entries": leaderboard})

    async def timer_tick(self, event):
        """
        Triggered by a Celery beat task for timed quizzes.
        Broadcasts seconds remaining to all participants.
        """
        await self.send_json(
            {
                "type": "timer_tick",
                "seconds_remaining": event["seconds_remaining"],
            }
        )

    async def quiz_ended(self, event):
        """
        Triggered when the quiz time expires or is manually closed.
        Sends final leaderboard then signals end-of-session.
        """
        leaderboard = await self._build_leaderboard()
        await self.send_json({"type": "leaderboard", "entries": leaderboard})
        await self.send_json({"type": "quiz_ended"})

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content, default=str))

    async def _broadcast_participant_count(self):
        count = _participant_counts.get(self.group_name, 0)
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "participant_count_event", "count": count},
        )

    async def participant_count_event(self, event):
        await self.send_json({"type": "participant_count", "count": event["count"]})

    @database_sync_to_async
    def _get_quiz(self):
        from apps.elearning.models.quiz import Quiz

        try:
            return Quiz.objects.get(
                id=self.quiz_id, is_active=True, deleted_at__isnull=True
            )
        except Quiz.DoesNotExist:
            return None

    @database_sync_to_async
    def _build_leaderboard(self) -> list:
        """
        Returns the top-10 leaderboard for this quiz.
        Each entry: { rank, user: {id, full_name}, best_score, passed, attempts }
        """
        from django.db.models import Max, Count
        from apps.elearning.models.quiz import QuizAttempt
        from apps.accounts.models import User

        rows = (
            QuizAttempt.objects.filter(
                quiz_id=self.quiz_id,
                completed_at__isnull=False,
                deleted_at__isnull=True,
            )
            .values("user_id")
            .annotate(
                best_score=Max("score"),
                attempts=Count("id"),
            )
            .order_by("-best_score")[:10]
        )

        user_ids = [r["user_id"] for r in rows]
        users = {str(u.id): u for u in User.objects.filter(id__in=user_ids)}

        # Check which users passed at least once
        passed_ids = set(
            QuizAttempt.objects.filter(
                quiz_id=self.quiz_id,
                user_id__in=user_ids,
                passed=True,
                deleted_at__isnull=True,
            ).values_list("user_id", flat=True)
        )

        entries = []
        for rank, row in enumerate(rows, start=1):
            user = users.get(str(row["user_id"]))
            if not user:
                continue
            entries.append(
                {
                    "rank": rank,
                    "user": {
                        "id": str(user.id),
                        "full_name": user.get_full_name(),
                        "avatar": user.avatar.url if user.avatar else None,
                    },
                    "best_score": float(row["best_score"]),
                    "passed": row["user_id"] in passed_ids,
                    "attempts": row["attempts"],
                }
            )

        return entries

    # ------------------------------------------------------------------
    # Class-level broadcast helpers (call from Celery / views)
    # ------------------------------------------------------------------

    @classmethod
    async def broadcast_leaderboard_update(cls, quiz_id: str):
        """Push a leaderboard refresh to all connected quiz participants."""
        from channels.layers import get_channel_layer

        await get_channel_layer().group_send(
            f"quiz_{quiz_id}",
            {"type": "leaderboard_update", "quiz_id": quiz_id},
        )

    @classmethod
    async def broadcast_timer_tick(cls, quiz_id: str, seconds_remaining: int):
        """Push a timer tick to all connected quiz participants."""
        from channels.layers import get_channel_layer

        await get_channel_layer().group_send(
            f"quiz_{quiz_id}",
            {"type": "timer_tick", "seconds_remaining": seconds_remaining},
        )

    @classmethod
    async def broadcast_quiz_ended(cls, quiz_id: str):
        """Signal end-of-quiz to all connected participants."""
        from channels.layers import get_channel_layer

        await get_channel_layer().group_send(
            f"quiz_{quiz_id}",
            {"type": "quiz_ended"},
        )
