"""
JWT Authentication Middleware for Django Channels WebSocket connections.

Clients authenticate with a short-lived, single-use handshake ticket:
    ws://host/ws/notifications/?ticket=<opaque-ticket>

On successful validation the authenticated User is attached to scope["user"].
On failure scope["user"] is set to AnonymousUser and the connection is closed
by consumers that require authentication.
"""

import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_ticket(ticket: str):
    """
    Consume a one-time ticket and return the corresponding User.
    Returns AnonymousUser if the token is invalid or expired.
    """
    from apps.accounts.models import User

    cache_key = f"websocket-ticket:{ticket}"
    user_id = cache.get(cache_key)
    if not user_id:
        return AnonymousUser()

    # Atomically claim the ticket before deleting it. This closes the narrow
    # race where two simultaneous handshakes could both read the cache entry.
    if not cache.add(f"websocket-ticket-used:{ticket}", True, 30):
        return AnonymousUser()
    cache.delete(cache_key)
    try:
        return User.objects.get(id=user_id, is_active=True)
    except (User.DoesNotExist, ValueError) as exc:
        logger.debug("WS auth failed: %s", exc)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Channels middleware that authenticates WebSockets with one-time tickets.

    Token is read from:
        Query string ?ticket=<opaque-ticket>. The credential expires quickly
        and is deleted as soon as it is used.
    """

    async def __call__(self, scope, receive, send):
        # Only apply to WebSocket connections
        if scope["type"] not in ("websocket", "http"):
            return await super().__call__(scope, receive, send)

        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        ticket_list = params.get("ticket", [])

        if ticket_list:
            scope["user"] = await get_user_from_ticket(ticket_list[0])
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
