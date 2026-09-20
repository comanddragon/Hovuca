"""Rate limits for sensitive API operations."""

import hashlib

from rest_framework.throttling import SimpleRateThrottle

from core.security import get_client_ip


class ClientIPThrottle(SimpleRateThrottle):
    """Throttle unauthenticated operations by the proxy-normalized client IP."""

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": get_client_ip(request),
        }


class CredentialThrottle(ClientIPThrottle):
    """Throttle login attempts by both client IP and normalized identifier."""

    def get_cache_key(self, request, view):
        identifier = str(request.data.get("email", "")).strip().casefold()
        digest = hashlib.sha256(identifier.encode()).hexdigest()[:24]
        ident = f"{get_client_ip(request)}:{digest}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginBurstThrottle(CredentialThrottle):
    scope = "login_burst"
    rate = "5/min"


class LoginSustainedThrottle(CredentialThrottle):
    scope = "login_sustained"
    rate = "20/hour"


class LoginIPThrottle(ClientIPThrottle):
    scope = "login_ip"
    rate = "50/hour"


class RegisterThrottle(ClientIPThrottle):
    scope = "register"
    rate = "5/hour"


class PasswordResetRequestThrottle(ClientIPThrottle):
    scope = "password_reset_request"
    rate = "5/hour"


class PasswordResetConfirmThrottle(ClientIPThrottle):
    scope = "password_reset_confirm"
    rate = "10/hour"


class TokenRefreshThrottle(ClientIPThrottle):
    scope = "token_refresh"
    rate = "60/hour"


class WebSocketTicketThrottle(SimpleRateThrottle):
    scope = "websocket_ticket"
    rate = "30/min"

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": request.user.pk,
        }


class PasswordChangeThrottle(SimpleRateThrottle):
    scope = "password_change"
    rate = "5/hour"

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": request.user.pk,
        }
