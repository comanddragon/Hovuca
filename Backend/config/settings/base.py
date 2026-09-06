from datetime import timedelta
from pathlib import Path

from decouple import Csv, config
from kombu import Queue


BASE_DIR = Path(__file__).resolve().parent.parent.parent


SECRET_KEY = config("DJANGO_SECRET_KEY")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1",
    cast=Csv(),
)

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:3000", cast=Csv()
)

DJANGO_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
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
]

LOCAL_APPS = [
    "apps.core",
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

INSTALLED_APPS = [
    *DJANGO_APPS,
    *THIRD_PARTY_APPS,
    *LOCAL_APPS,
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


AUTH_USER_MODEL = "accounts.User"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

LOG_URL = "/logs/"
LOG_ROOT = BASE_DIR / "logs"


STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REDIS_URL = config(
    "REDIS_URL",
    default="redis://127.0.0.1:6379/0",
)


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    },
}


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": config("THROTTLE_ANON", default="100/hour"),
        "user": config("THROTTLE_USER", default="1000/hour"),
    },
}


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_MINUTES", default=60, cast=int),
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_DAYS", default=7, cast=int),
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": (
        "rest_framework_simplejwt.authentication."
        "default_user_authentication_rule"
    ),
    "TOKEN_OBTAIN_SERIALIZER": (
        "apps.accounts.serializers.CustomTokenObtainPairSerializer"
    ),
}

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}


CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = config(
    "CELERY_RESULT_BACKEND",
    default="django-db",
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "visibility_timeout": 3600,
}
CELERY_BEAT_SCHEDULER = (
    "django_celery_beat.schedulers:DatabaseScheduler"
)
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60

CELERY_TASK_QUEUES = (
    Queue("celery"),
    Queue("accounts"),
)

CELERY_TASK_ROUTES = {
    "accounts.*": {"queue": "accounts"},
    "notifications.*": {"queue": "celery"},
}


SUPABASE_PROJECT_REF = config("SUPABASE_PROJECT_REF", default="")
SUPABASE_STORAGE_BUCKET = config(
    "SUPABASE_STORAGE_BUCKET",
    default="hovuca-media",
)
SUPABASE_STORAGE_REGION = config(
    "SUPABASE_STORAGE_REGION",
    default="ap-southeast-1",
)
SUPABASE_STORAGE_KEY_ID = config(
    "SUPABASE_STORAGE_KEY_ID",
    default="",
)
SUPABASE_STORAGE_SECRET = config(
    "SUPABASE_STORAGE_SECRET",
    default="",
)

NEON_STORAGE_ENDPOINT = config("NEON_STORAGE_ENDPOINT", default="")
NEON_STORAGE_PUBLIC_URL = config("NEON_STORAGE_PUBLIC_URL", default="")
NEON_STORAGE_BUCKET = config("NEON_STORAGE_BUCKET", default="")
NEON_STORAGE_REGION = config("NEON_STORAGE_REGION", default="auto")
NEON_STORAGE_KEY_ID = config("NEON_STORAGE_KEY_ID", default="")
NEON_STORAGE_SECRET = config("NEON_STORAGE_SECRET", default="")


RESEND_API_KEY = config("RESEND_API_KEY", default="")
RESEND_FROM = config("RESEND_FROM", default="")


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


def get_frontend_url(request):
    origin = request.META.get("HTTP_ORIGIN")

    if origin:
        return origin

    scheme = "https" if request.is_secure() else "http"
    return f"{scheme}://{request.get_host()}"
