"""Request tracing and response hardening applied across environments."""

import re
from uuid import uuid4

from core.logging import request_id_context

REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


class RequestIDMiddleware:
    """Correlate logs and responses without trusting arbitrary header values."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        supplied_id = request.headers.get("X-Request-ID", "")
        request_id = (
            supplied_id
            if REQUEST_ID_PATTERN.fullmatch(supplied_id)
            else uuid4().hex
        )
        token = request_id_context.set(request_id)
        request.request_id = request_id
        try:
            response = self.get_response(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_context.reset(token)


class SecurityResponseHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()",
        )

        if request.path.startswith(("/api/v1/auth/", "/admin/")):
            response.headers["Cache-Control"] = "no-store, private"
            response.headers["Pragma"] = "no-cache"

        return response
