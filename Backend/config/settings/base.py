from datetime import timedelta
from pathlib import Path
from decouple import config
from django.templatetags.static import static
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from kombu import Queue

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY")

INSTALLED_APPS = [
    "unfold",  # before django.contrib.admin
    "unfold.contrib.filters",  # optional, if special filters are needed
    "unfold.contrib.forms",  # optional, if special form elements are needed
    "unfold.contrib.inlines",  # optional, if special inlines are needed
    "unfold.contrib.import_export",  # optional, if django-import-export package is used
    "unfold.contrib.guardian",  # optional, if django-guardian package is used
    "unfold.contrib.simple_history",  # optional, if django-simple-history package is used
    "unfold.contrib.location_field",  # optional, if django-location-field package is used
    "unfold.contrib.constance",  # optional, if django-constance package is used
    "unfold.contrib.hijack",  # optional, if django-hijack package is used
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "storages",
    "channels",
    "django_celery_beat",
    "django_celery_results",
    "core",
    "apps.accounts",
    "apps.blogs",
    "apps.organization",
    "apps.programs",
    "apps.volunteers",
    "apps.donations",
    "apps.elearning",
    "apps.notifications",
    "apps.realtime",
    "apps.events",
    "apps.gallery",
    "apps.donors",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_USER_MODEL = "accounts.User"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Authentication — Simple JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_MINUTES", default=60, cast=int),),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_DAYS", default=7, cast=int),),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---------------------------------------------------------------------------
# Channels (WebSockets)
# ---------------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(config("REDIS_HOST"), 6379)],
        },
    },
}

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("REDIS_URL", ""),
    }
}

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Unfold admin
# ---------------------------------------------------------------------------
UNFOLD = {
    "SITE_TITLE": _("HOVUCA Admin"),
    "SITE_HEADER": _("HOVUCA"),
    "SITE_SUBHEADER": _("Site operations"),
    "DASHBOARD_CALLBACK": "core.admin_dashboard.dashboard_callback",
    "STYLES": [lambda request: static("admin/dashboard.css")],
}

# ---------------------------------------------------------------------------
# OpenAPI
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "HOVUCA NGO Platform API",
    "DESCRIPTION": (
        "REST API for the HOVUCA NGO platform covering "
        "e-learning, volunteer management, donations, "
        "real-time notifications, and more."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]",
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
    },
}

# ---------------------------------------------------------------------------
# Email (base — overridden per environment)
# ---------------------------------------------------------------------------
RESEND_API_KEY = config("RESEND_API_KEY", default="")
RESEND_FROM = config("RESEND_FROM", default="")

CELERY_BROKER_URL = config("REDIS_URL")
CELERY_RESULT_BACKEND = config( "CELERY_RESULT_BACKEND", default="django-db" )
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_TRANSPORT_OPTIONS = { "visibility_timeout": 3600 }
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60

CELERY_TASK_QUEUES = (Queue("celery"), Queue("accounts"))

CELERY_TASK_ROUTES = {
    "accounts.*": {"queue": "accounts"},
    "notifications.*": {"queue": "celery"},
}


SUPABASE_PROJECT_REF = config("SUPABASE_PROJECT_REF", default="")
SUPABASE_STORAGE_BUCKET = config("SUPABASE_STORAGE_BUCKET", default="hovuca-media",)
SUPABASE_STORAGE_REGION = config("SUPABASE_STORAGE_REGION", default="ap-southeast-1",)
SUPABASE_STORAGE_KEY_ID = config("SUPABASE_STORAGE_KEY_ID", default="",)
SUPABASE_STORAGE_SECRET = config("SUPABASE_STORAGE_SECRET", default="",)

NEON_STORAGE_ENDPOINT = config("NEON_STORAGE_ENDPOINT", default="")
NEON_STORAGE_PUBLIC_URL = config("NEON_STORAGE_PUBLIC_URL", default="")
NEON_STORAGE_BUCKET = config("NEON_STORAGE_BUCKET", default="")
NEON_STORAGE_REGION = config("NEON_STORAGE_REGION", default="auto")
NEON_STORAGE_KEY_ID = config("NEON_STORAGE_KEY_ID", default="")
NEON_STORAGE_SECRET = config("NEON_STORAGE_SECRET", default="")




# Payment providers. Individual storefronts can override these through a
# provider-account model later; these defaults preserve the existing gateways.

# Branding vars injected into every templates/emails/*.html render.

def get_frontend_url(request):
    origin = request.META.get("HTTP_ORIGIN")

    if origin:
        return origin

    scheme = "https" if request.is_secure() else "http"
    return f"{scheme}://{request.get_host()}"
