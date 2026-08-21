"""
ASGI config for ngo_platform.

Exposes the ASGI callable as `application`.
Handles both standard HTTP (via Django) and WebSocket connections
(via Django Channels + Daphne).
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.getenv("DJANGO_SETTINGS_MODULE"))

# Initialize Django ASGI app early so AppRegistry is populated
django_asgi_app = get_asgi_application()

from apps.realtime.middleware import JWTAuthMiddlewareStack  # noqa: E402
from apps.realtime.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        # Standard HTTP — handled by Django
        "http": django_asgi_app,
        # WebSocket — JWT-authenticated, host-validated
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)
