import json
import logging

from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from core.logging import (
    ColorFormatter,
    JsonFormatter,
    RequestContextFilter,
    redact_sensitive_data,
    request_id_context,
)
from core.middleware import RequestIDMiddleware, SecurityResponseHeadersMiddleware


class SecurityResponseHeadersMiddlewareTests(SimpleTestCase):
    def test_auth_responses_are_not_cacheable(self):
        request = RequestFactory().get("/api/v1/auth/login/")
        middleware = SecurityResponseHeadersMiddleware(
            lambda request: HttpResponse("ok")
        )

        response = middleware(request)

        self.assertEqual(response.headers["Cache-Control"], "no-store, private")
        self.assertEqual(response.headers["Pragma"], "no-cache")
        self.assertEqual(
            response.headers["Permissions-Policy"],
            "camera=(), microphone=(), geolocation=()",
        )


class RequestIDMiddlewareTests(SimpleTestCase):
    def test_valid_request_id_is_returned_and_available_during_request(self):
        request = RequestFactory().get("/", headers={"X-Request-ID": "deploy-42"})
        observed_request_ids = []
        middleware = RequestIDMiddleware(
            lambda request: observed_request_ids.append(request_id_context.get())
            or HttpResponse("ok")
        )

        response = middleware(request)

        self.assertEqual(response.headers["X-Request-ID"], "deploy-42")
        self.assertEqual(observed_request_ids, ["deploy-42"])
        self.assertIsNone(request_id_context.get())

    def test_invalid_request_id_is_replaced(self):
        request = RequestFactory().get("/", headers={"X-Request-ID": "bad id"})
        response = RequestIDMiddleware(lambda request: HttpResponse("ok"))(request)

        self.assertRegex(response.headers["X-Request-ID"], r"^[0-9a-f]{32}$")


class JsonFormatterTests(SimpleTestCase):
    def test_log_output_is_structured_and_contains_request_id(self):
        token = request_id_context.set("request-123")
        try:
            record = logging.LogRecord(
                name="core.tests",
                level=logging.INFO,
                pathname=__file__,
                lineno=1,
                msg="Processed %s",
                args=("resource",),
                exc_info=None,
            )
            RequestContextFilter().filter(record)
            payload = json.loads(JsonFormatter().format(record))
        finally:
            request_id_context.reset(token)

        self.assertEqual(payload["level"], "INFO")
        self.assertEqual(payload["message"], "Processed resource")
        self.assertEqual(payload["request_id"], "request-123")
        self.assertEqual(payload["logger"], "core.tests")

    def test_log_output_redacts_personal_data_and_credentials(self):
        record = logging.LogRecord(
            name="core.tests",
            level=logging.WARNING,
            pathname=__file__,
            lineno=1,
            msg="Email alice@example.com token=top-secret Bearer abc.def.ghi",
            args=(),
            exc_info=None,
        )

        payload = json.loads(JsonFormatter().format(record))

        self.assertNotIn("alice@example.com", payload["message"])
        self.assertNotIn("top-secret", payload["message"])
        self.assertNotIn("abc.def.ghi", payload["message"])
        self.assertIn("[redacted-email]", payload["message"])
        self.assertEqual(
            redact_sensitive_data("password: hunter2"), "password: [redacted]"
        )


class ColorFormatterTests(SimpleTestCase):
    def test_development_levels_use_the_expected_terminal_colours(self):
        formatter = ColorFormatter("%(message)s")

        for level, colour in (
            (logging.INFO, "\033[36m"),
            (logging.WARNING, "\033[38;5;208m"),
            (logging.ERROR, "\033[38;5;196m"),
        ):
            record = logging.LogRecord(
                name="core.tests",
                level=level,
                pathname=__file__,
                lineno=1,
                msg="colour check",
                args=(),
                exc_info=None,
            )
            self.assertEqual(formatter.format(record), f"{colour}colour check\033[0m")
