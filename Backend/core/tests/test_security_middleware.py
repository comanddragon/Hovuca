from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from core.middleware import SecurityResponseHeadersMiddleware


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
