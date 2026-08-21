"""
Development settings — debug-friendly, local services, relaxed security.
Activate with: DJANGO_SETTINGS_MODULE=config.settings.development
"""

from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Core overrides
# ---------------------------------------------------------------------------

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="hovuca"),
        "USER": config("DB_USER", default="silkkeith"),
        "PASSWORD": config("DB_PASSWORD", default="85213"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "CONN_MAX_AGE": config("DB_CONN_MAX_AGE", default=60, cast=int),
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}
# ---------------------------------------------------------------------------
# Developer toolbar & extensions
# ---------------------------------------------------------------------------

INSTALLED_APPS += [  # noqa: F405
    "django_extensions",
    "debug_toolbar",
]

MIDDLEWARE += [  # noqa: F405
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "apps.core.middleware.RequestLoggingMiddleware",
]

INTERNAL_IPS = ["127.0.0.1", "localhost"]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
}

# ---------------------------------------------------------------------------
# Email — print to console
# ---------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# Media & Static — local filesystem
# ---------------------------------------------------------------------------

DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# ---------------------------------------------------------------------------
# CORS — allow all origins
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = True

# ---------------------------------------------------------------------------
# Channels — in-memory (no Redis needed)
# ---------------------------------------------------------------------------

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# ---------------------------------------------------------------------------
# JWT — longer lifetime for developer convenience
# ---------------------------------------------------------------------------

from datetime import timedelta  # noqa: E402
from decouple import config     # noqa: E402

SIMPLE_JWT = {
    **SIMPLE_JWT,  # noqa: F405
    "ACCESS_TOKEN_LIFETIME": timedelta(
        days=config("JWT_DEV_ACCESS_DAYS", default=1, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_DEV_REFRESH_DAYS", default=30, cast=int)
    ),
}

# ---------------------------------------------------------------------------
# DRF — enable browsable API
# ---------------------------------------------------------------------------

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += [  # noqa: F405
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "simple",
        },
        "file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "root.log",  # noqa: F405
            "formatter": "verbose",
        },
        "django_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "django.log",  # noqa: F405
            "formatter": "verbose",
        },
        "apps_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "apps.log",  # noqa: F405
            "formatter": "verbose",
        },
        "celery_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "celery.log",  # noqa: F405
            "formatter": "verbose",
        },
        "ws_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "ws.log",  # noqa: F405
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "DEBUG",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "django_file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console", "apps_file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console", "celery_file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery.worker": {
            "handlers": ["console", "celery_file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery.task": {
            "handlers": ["console", "celery_file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "apps.realtime": {
            "handlers": ["console", "ws_file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}