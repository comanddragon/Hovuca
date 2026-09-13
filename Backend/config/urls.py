from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include, re_path
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.static import serve as serve_media
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
def home(request):
    return JsonResponse({"message": "API is live"})

def health(request):
    # Runs a trivial query (not just an app-level ping) so external cron
    # hits to this endpoint also count as DB activity for Neon — otherwise
    # the web service stays warm while the Neon compute still auto-suspends
    # after ~5 min of no queries, and the next real API call pays the
    # multi-second wake-up cost.
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"status": "ok"})
urlpatterns = [
    path("", health),

    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("admin/", admin.site.urls),
    path("", home),
    path('api/health/', lambda request: JsonResponse({'status': 'ok'})),
    path("api/v1/", include("api.v1.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += [
        re_path(
            r"^media/(?P<path>.*)$",
            xframe_options_exempt(serve_media),
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Django Debug Toolbar
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass
