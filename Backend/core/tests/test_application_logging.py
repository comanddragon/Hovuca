import logging

from django.test import TestCase

from core.logging import DatabaseLogHandler, request_id_context
from core.models import ApplicationLog


class DatabaseLogHandlerTests(TestCase):
    def test_warning_is_saved_with_request_context(self):
        token = request_id_context.set("request-456")
        try:
            logger = logging.getLogger("core.tests.database_logging")
            handler = DatabaseLogHandler()
            logger.addHandler(handler)
            logger.propagate = False
            logger.warning("Document preview failed")
        finally:
            logger.removeHandler(handler)
            logger.propagate = True
            request_id_context.reset(token)

        entry = ApplicationLog.objects.get()
        self.assertEqual(entry.level, "WARNING")
        self.assertEqual(entry.logger, "core.tests.database_logging")
        self.assertEqual(entry.message, "Document preview failed")
        self.assertEqual(entry.request_id, "request-456")

    def test_saved_log_redacts_sensitive_data(self):
        logger = logging.getLogger("core.tests.database_logging_redaction")
        handler = DatabaseLogHandler()
        logger.addHandler(handler)
        logger.propagate = False
        try:
            logger.warning("Verification failed for alice@example.com token=top-secret")
        finally:
            logger.removeHandler(handler)
            logger.propagate = True

        entry = ApplicationLog.objects.get()
        self.assertNotIn("alice@example.com", entry.message)
        self.assertNotIn("top-secret", entry.message)
        self.assertIn("[redacted-email]", entry.message)
