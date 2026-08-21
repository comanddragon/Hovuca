from .base import *  # noqa: F401, F403


DEBUG = True

ALLOWED_HOSTS = ["*"]


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="hovuca"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "CONN_MAX_AGE": config(
            "DB_CONN_MAX_AGE",
            default=60,
            cast=int,
        ),
        "OPTIONS": {
            "connect_timeout": 10,
        },
    },
}


INSTALLED_APPS += [
    "django_extensions",
    "debug_toolbar",
]

MIDDLEWARE += [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "apps.core.middleware.RequestLoggingMiddleware",
]


INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
}


EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
        ),
    },
}


CORS_ALLOW_ALL_ORIGINS = True


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}


SIMPLE_JWT = {
    **SIMPLE_JWT,
    "ACCESS_TOKEN_LIFETIME": timedelta(
        days=config(
            "JWT_DEV_ACCESS_DAYS",
            default=1,
            cast=int,
        ),
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config(
            "JWT_DEV_REFRESH_DAYS",
            default=30,
            cast=int,
        ),
    ),
}


REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        *REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"],
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}


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
            "filename": LOG_ROOT / "root.log",
            "formatter": "verbose",
        },
        "django_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "django.log",
            "formatter": "verbose",
        },
        "apps_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "apps.log",
            "formatter": "verbose",
        },
        "celery_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "celery.log",
            "formatter": "verbose",
        },
        "ws_file": {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "filename": LOG_ROOT / "ws.log",
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