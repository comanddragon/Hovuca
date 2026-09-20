from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include, re_path
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.generic import RedirectView
from django.views.static import serve as serve_media
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# Render checks this frequently
def health(request):
    return JsonResponse({"status": "ok"})


# cron-job.org hits this every 5-10 minutes
def database_health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")

    return JsonResponse({
        "status": "ok",
        "database": "ok",
    })
    
urlpatterns = [
    path("", RedirectView.as_view(pattern_name="admin:index", permanent=False)),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("admin/", admin.site.urls),
    path("health", health),                 # Render
    path("api/health/", database_health),   # cron-job.org
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
    if getattr(settings, "ENABLE_DEBUG_TOOLBAR", False):
        import debug_toolbar

        urlpatterns += [
            path("__debug__/", include(debug_toolbar.urls)),
        ]
