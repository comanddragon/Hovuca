from .base import *  # noqa: F401, F403

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
