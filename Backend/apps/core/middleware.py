import logging
from django.urls import resolve, Resolver404

logger = logging.getLogger("apps")  # routes to apps.log

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        view_name = self._resolve_view_name(request)

        if view_name:
            logger.debug(f"{view_name} called")

        logger.debug(f"{request.method} {request.path} by user {request.user}")
        response = self.get_response(request)
        return response

    @staticmethod
    def _resolve_view_name(request) -> str | None:
        try:
            match = resolve(request.path_info)
        except Resolver404:
            return None

        func = match.func

        # DRF ViewSet routed through as_view() — cls is attached
        if hasattr(func, "cls"):
            cls = func.cls
            module = cls.__module__
            # Try to get the action (list, retrieve, custom action)
            action = match.kwargs.get("action") or getattr(func, "actions", {}).get(request.method.lower())
            suffix = f".{action}" if action else ""
            return f"{module}.{cls.__name__}{suffix}"

        # DRF @api_view or plain function view
        if hasattr(func, "__name__"):
            module = func.__module__
            return f"{module}.{func.__name__}"

        return None