"""
WebSocket URL routing for the realtime app.
Mounted in config/asgi.py via URLRouter.

Endpoints:
    /ws/notifications/          — personal notification stream (per user)
    /ws/chat/<room_id>/         — live chat / support room
    /ws/quiz/<quiz_id>/         — live quiz session & leaderboard
"""

from django.urls import re_path

from apps.realtime.consumers.notifications import NotificationConsumer
from apps.realtime.consumers.chat import ChatConsumer
from apps.realtime.consumers.quiz import QuizConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/chat/(?P<room_id>[0-9a-f-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"^ws/quiz/(?P<quiz_id>[0-9a-f-]+)/$", QuizConsumer.as_asgi()),
]
