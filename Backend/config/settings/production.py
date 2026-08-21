import dj_database_url
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration

from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS",
    default="",
    cast=Csv(),
)


DATABASE_URL = (
    config("DATABASE_URL", default="")
    or config("NEON_DB_URL", default="")
    or config("SUPABASE_DB_URL", default="")
)

if not DATABASE_URL:
    raise RuntimeError(
        "Production database URL is not configured."
    )


DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True,
    ),
}

DATABASES["default"]["OPTIONS"] = {
    **DATABASES["default"].get("OPTIONS", {}),
    "connect_timeout": 10,
    "sslmode": "require",
    "options": "-c statement_timeout=30000",
}


SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

X_FRAME_OPTIONS = "DENY"


SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"


CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="",
    cast=Csv(),
)


if not SUPABASE_PROJECT_REF:
    raise RuntimeError(
        "SUPABASE_PROJECT_REF must be configured."
    )

if not SUPABASE_STORAGE_KEY_ID:
    raise RuntimeError(
        "SUPABASE_STORAGE_KEY_ID must be configured."
    )

if not SUPABASE_STORAGE_SECRET:
    raise RuntimeError(
        "SUPABASE_STORAGE_SECRET must be configured."
    )


SUPABASE_S3_ENDPOINT = (
    f"https://{SUPABASE_PROJECT_REF}.supabase.co"
    "/storage/v1/s3"
)

SUPABASE_PUBLIC_ENDPOINT = (
    f"https://{SUPABASE_PROJECT_REF}.supabase.co"
    "/storage/v1/object/public"
)

MEDIA_URL = (
    f"{SUPABASE_PUBLIC_ENDPOINT}/"
    f"{SUPABASE_STORAGE_BUCKET}/media/"
)


STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "access_key": SUPABASE_STORAGE_KEY_ID,
            "secret_key": SUPABASE_STORAGE_SECRET,
            "bucket_name": SUPABASE_STORAGE_BUCKET,
            "region_name": SUPABASE_STORAGE_REGION,
            "endpoint_url": SUPABASE_S3_ENDPOINT,
            "location": "media",
            "file_overwrite": False,
            "default_acl": None,
            "querystring_auth": False,
            "use_ssl": True,
            "verify": True,
            "object_parameters": {
                "CacheControl": "max-age=86400",
            },
        },
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": "hovuca",
        "TIMEOUT": 300,
    },
}


SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}


EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")

DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL",
    default=RESEND_FROM,
)


REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        "anon": config(
            "THROTTLE_ANON",
            default="60/hour",
        ),
        "user": config(
            "THROTTLE_USER",
            default="500/hour",
        ),
        "login": config(
            "THROTTLE_LOGIN",
            default="10/minute",
        ),
    },
}


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": (
                "%(asctime)s "
                "%(levelname)s "
                "%(name)s "
                "%(message)s"
            ),
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


SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(transaction_style="url"),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=config(
            "SENTRY_TRACES_SAMPLE_RATE",
            default=0.1,
            cast=float,
        ),
        send_default_pii=False,
        environment="production",
        release=config("APP_VERSION", default="1.0.0"),
    )