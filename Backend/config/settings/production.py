"""
Production settings — hardened security, Supabase Storage, Redis channels, strict CORS.
Activate with: DJANGO_SETTINGS_MODULE=config.settings.production
All secrets must be provided via environment variables — never hardcoded.
"""
from urllib.parse import urlparse, parse_qsl
import dj_database_url
from .base import *  # noqa: F401, F403
from decouple import config
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = False

neon = config("NEON_DB_URL")
supabase = config("SUPABASE_DB_URL")

DATABASES = {
    # 'default': dj_database_url.config(default=supabase, conn_max_age=60, ssl_require=False),
    'default': dj_database_url.config(default=neon, conn_max_age=60, ssl_require=False),
}
# ---------------------------------------------------------------------------
# Security hardening
# ---------------------------------------------------------------------------

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"

X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# ---------------------------------------------------------------------------
# Media — Supabase Storage (S3-compatible)
# ---------------------------------------------------------------------------
# Supabase Storage speaks the S3 protocol, so we use django-storages S3Boto3.

supabase_endpoint = (
    f"https://{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3"  # noqa: F405
    if SUPABASE_PROJECT_REF  # noqa: F405
    else ""
)

supabase_public_url = (
    f"https://{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public"  # noqa: F405
    if SUPABASE_PROJECT_REF  # noqa: F405
    else ""
)

STORAGES = {
    # Media files → Supabase Storage bucket
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "access_key": SUPABASE_STORAGE_KEY_ID,         # noqa: F405
            "secret_key": SUPABASE_STORAGE_SECRET,         # noqa: F405
            "bucket_name": SUPABASE_STORAGE_BUCKET,        # noqa: F405
            "region_name": SUPABASE_STORAGE_REGION,        # noqa: F405
            "endpoint_url": supabase_endpoint,
            # Files uploaded to this prefix inside the bucket
            "location": "media",
            "file_overwrite": False,
            "default_acl": None,
            # No extra S3 ACL headers — Supabase manages access via bucket policies
            "use_ssl": True,
            "verify": True,
            "object_parameters": {"CacheControl": "max-age=86400"},
            # Public URL base so Django generates correct media URLs
            "custom_domain": (
                f"{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}"  # noqa: F405
                if SUPABASE_PROJECT_REF  # noqa: F405
                else None
            ),
        },
    },
    # Static files → Whitenoise (local, served by the app server)
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# MEDIA_URL used by Django's url() template tag and serializers
if SUPABASE_PROJECT_REF:  # noqa: F405
    MEDIA_URL = f"{supabase_public_url}/{SUPABASE_STORAGE_BUCKET}/media/"  # noqa: F405

# ---------------------------------------------------------------------------
# Database — tighter connection settings for production
# ---------------------------------------------------------------------------

DATABASES["default"].update(  # noqa: F405
    {
        "CONN_MAX_AGE": 600,
        "OPTIONS": {
            "connect_timeout": 10,
            "sslmode": "require",
            "options": "-c statement_timeout=30000",
        },
    }
)

# ---------------------------------------------------------------------------
# Caching — Redis
# ---------------------------------------------------------------------------

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",  # only for django-redis < 6
        },
        "KEY_PREFIX": "hovuca",
        "TIMEOUT": 300,
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ---------------------------------------------------------------------------
# Email — production SMTP
# ---------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# ---------------------------------------------------------------------------
# Throttling — tighter limits
# ---------------------------------------------------------------------------

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": "60/hour",
    "user": "500/hour",
    "login": "10/minute",
}

# ---------------------------------------------------------------------------
# Logging — structured JSON for log aggregators
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# ---------------------------------------------------------------------------
# Sentry — error tracking
# ---------------------------------------------------------------------------

SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(transaction_style="url"),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=config("SENTRY_TRACES_SAMPLE_RATE", default=0.1, cast=float),
        send_default_pii=False,
        environment="production",
        release=config("APP_VERSION", default="1.0.0"),
    )