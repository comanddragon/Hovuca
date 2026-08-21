"""
WSGI config for ngo_platform.

Used for traditional synchronous HTTP serving (e.g. Gunicorn).
For WebSocket / real-time support use asgi.py with Daphne instead.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_wsgi_application()
