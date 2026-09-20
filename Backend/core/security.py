"""Security helpers shared by authentication and request throttling."""

import ipaddress

from django.conf import settings
from django.http import HttpResponse, JsonResponse


def get_client_ip(request) -> str:
    """Resolve a client IP behind the configured number of trusted proxies."""
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    addresses = [item.strip() for item in forwarded_for.split(",") if item.strip()]
    proxy_count = max(getattr(settings, "TRUSTED_PROXY_COUNT", 1), 1)

    candidate = (
        addresses[-min(proxy_count, len(addresses))]
        if addresses
        else request.META.get("REMOTE_ADDR", "")
    )
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return "0.0.0.0"


def lockout_response(request, credentials, *args, **kwargs):
    """Return an API-friendly response when Axes locks authentication."""
    message = "Too many failed login attempts. Please try again later."
    if request.path.startswith("/api/"):
        return JsonResponse({"detail": message}, status=429)
    return HttpResponse(message, status=429, content_type="text/plain")
