from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Postgres for local dev too — connection details come from env vars below
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME":    config("DB_NAME",     ""),
        "USER":     config("DB_USER",     ""),
        "PASSWORD": config("DB_PASSWORD", ""),
        "HOST":     config("DB_HOST",     ""),
        "PORT":     config("DB_PORT",     ""),
    }
}

# CORS — allow all origins locally
CORS_ALLOW_ALL_ORIGINS = True

# Never send real email during local development. Django renders each message,
# including its HTML alternative, to the process console instead.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

ENABLE_DEBUG_TOOLBAR = config(
    "ENABLE_DEBUG_TOOLBAR",
    default=False,
    cast=bool,
)

if ENABLE_DEBUG_TOOLBAR:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
    INTERNAL_IPS = ["127.0.0.1"]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "color": {
            "()": "core.logging.ColorFormatter",
            "format": "%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s",
            "datefmt": "%a %Y-%m-%d %H:%M:%S",
        },
    },
    "filters": {
        "request_context": {"()": "core.logging.RequestContextFilter"},
        "redact_sensitive_data": {"()": "core.logging.SensitiveDataFilter"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "formatter": "color",
            "filters": ["request_context", "redact_sensitive_data"],
        },
        "database": {
            "class": "core.logging.DatabaseLogHandler",
            "level": config("DATABASE_LOG_LEVEL", default="WARNING"),
            "filters": ["request_context", "redact_sensitive_data"],
        },
    },
    "root": {
        "handlers": ["console", "database"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "database"],
            "level": "INFO",
            "propagate": False,
        },
        "django.server": {
            "handlers": ["console", "database"],
            "level": "INFO",
            "propagate": False,
        },
        "gunicorn.access": {
            "handlers": ["console", "database"],
            "level": "INFO",
            "propagate": False,
        },
        "gunicorn.error": {
            "handlers": ["console", "database"],
            "level": "INFO",
            "propagate": False,
        },
        "apps.content.management.commands": {
            "handlers": ["console", "database"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
