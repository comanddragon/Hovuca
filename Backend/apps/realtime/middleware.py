"""
JWT Authentication Middleware for Django Channels WebSocket connections.

Clients authenticate by passing the JWT access token as a query parameter:
    ws://host/ws/notifications/?token=<access_token>

On successful validation the authenticated User is attached to scope["user"].
On failure scope["user"] is set to AnonymousUser and the connection is closed
by consumers that require authentication.
"""

import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token_key: str):
    """
    Validate a JWT access token and return the corresponding User.
    Returns AnonymousUser if the token is invalid or expired.
    """
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from apps.accounts.models import User

    try:
        token = AccessToken(token_key)
        user_id = token["user_id"]
        return User.objects.get(id=user_id, is_active=True)
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError) as exc:
        logger.debug("WS auth failed: %s", exc)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Channels middleware that authenticates WebSocket connections via JWT.

    Token is read from:
        1. Query string  ?token=<jwt>    (primary — easy for browser clients)
        2. Falls back to AnonymousUser if absent or invalid
    """

    async def __call__(self, scope, receive, send):
        # Only apply to WebSocket connections
        if scope["type"] not in ("websocket", "http"):
            return await super().__call__(scope, receive, send)

        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        if token_list:
            scope["user"] = await get_user_from_token(token_list[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience wrapper — mirrors Channels' AuthMiddlewareStack pattern.
    Usage in asgi.py:
        JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
    """
    return JWTAuthMiddleware(inner)
