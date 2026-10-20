"""Logging helpers shared by every Django environment."""

import contextvars
import json
import logging
import re
from datetime import UTC, datetime
from typing import ClassVar

request_id_context: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id", default=None
)


# Logs are retained outside the normal request lifecycle (and may be viewed by
# operations staff), so they must not become a secondary store of credentials
# or contact details. This is deliberately a last line of defence; application
# code should still log stable object IDs rather than personal data.
EMAIL_RE = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
BEARER_TOKEN_RE = re.compile(r"(?i)\bbearer\s+[A-Z0-9._~+/-]+=*")
URL_CREDENTIALS_RE = re.compile(r"(?i)(\b[a-z][a-z0-9+.-]*://)[^\s/@]+@")
SENSITIVE_VALUE_RE = re.compile(
    r"(?i)\b(password|passwd|secret|token|api[_-]?key|authorization|cookie|"
    r"session(?:_id|id)?)\b(\s*[:=]\s*)([^\s,;]+)"
)


def redact_sensitive_data(value: object) -> str:
    """Return text safe to send to retained or third-party log sinks."""
    text = str(value)
    text = URL_CREDENTIALS_RE.sub(r"\1[redacted]@", text)
    text = BEARER_TOKEN_RE.sub("Bearer [redacted]", text)
    text = SENSITIVE_VALUE_RE.sub(
        lambda match: f"{match.group(1)}{match.group(2)}[redacted]", text
    )
    return EMAIL_RE.sub("[redacted-email]", text)


class RequestContextFilter(logging.Filter):
    """Attach the request correlation ID to every application log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get() or "-"
        return True


class SensitiveDataFilter(logging.Filter):
    """Redact records before any configured handler receives them."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = redact_sensitive_data(record.getMessage())
        record.args = ()
        return True


class DatabaseLogHandler(logging.Handler):
    """Save operational logs without allowing logging failures to affect requests."""

    max_message_length = 16_000
    max_traceback_length = 32_000

    def emit(self, record: logging.LogRecord) -> None:
        try:
            from django.apps import apps

            application_log = apps.get_model("core", "ApplicationLog")
            traceback = (
                logging.Formatter().formatException(record.exc_info)
                if record.exc_info
                else ""
            )
            message = redact_sensitive_data(record.getMessage())
            application_log.objects.create(
                level=record.levelname,
                logger=record.name[:255],
                message=message[: self.max_message_length],
                request_id=(
                    getattr(record, "request_id", None)
                    or request_id_context.get()
                    or ""
                )[:128],
                traceback=redact_sensitive_data(traceback)[: self.max_traceback_length],
            )
        except Exception:
            # Logging must never make a request, task, or migration fail.
            pass


class JsonFormatter(logging.Formatter):
    """Emit one structured JSON object per log line for log aggregators."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_sensitive_data(record.getMessage()),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exception"] = redact_sensitive_data(
                self.formatException(record.exc_info)
            )
        if record.stack_info:
            payload["stack"] = redact_sensitive_data(
                self.formatStack(record.stack_info)
            )
        return json.dumps(payload, ensure_ascii=False, default=str)


class ColorFormatter(logging.Formatter):
    COLORS: ClassVar[dict[int, str]] = {
        logging.DEBUG: "\033[38;5;245m",
        logging.INFO: "\033[36m",
        logging.WARNING: "\033[38;5;208m",
        logging.ERROR: "\033[38;5;196m",
        logging.CRITICAL: "\033[48;5;196m\033[38;5;231m",
    }
    RESET: ClassVar[str] = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelno, "")
        return f"{color}{redact_sensitive_data(super().format(record))}{self.RESET}"
