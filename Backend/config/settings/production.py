import sentry_sdk
from decouple import config
from sentry_sdk.integrations.django import DjangoIntegration
from urllib.parse import parse_qsl, urlparse


from .base import *  # noqa: F401, F403

DEBUG = True

# All Django email APIs use Resend in production.
EMAIL_BACKEND = "core.email_backends.ResendEmailBackend"
FRONTEND_URL = config("FRONTEND_URL", default="https://hovuca.org").rstrip("/")

configured_hosts = [
    host.strip()
    for host in config(
        "DJANGO_ALLOWED_HOSTS", default=config("ALLOWED_HOSTS", default="")
    ).split(",")
    if host.strip()
]
render_hostname = config("RENDER_EXTERNAL_HOSTNAME", default="").strip()
ALLOWED_HOSTS = list(
    dict.fromkeys(
        [
            *configured_hosts,
            ".hovuca.org",
            ".onrender.com",
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            render_hostname,
        ]
    )
)
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

# ---------------------------------------------------------------------------
# Database — Postgres with connection pooling
# ---------------------------------------------------------------------------
DATABASE_URL = config("NEON_DB_URL")

tmp_postgres = urlparse(DATABASE_URL)

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     tmp_postgres.path.lstrip("/"),
        "USER":     tmp_postgres.username,
        "PASSWORD": tmp_postgres.password,
        "HOST":     tmp_postgres.hostname,
        "PORT":     tmp_postgres.port or 5432,
        "CONN_MAX_AGE": 60,
        "DISABLE_SERVER_SIDE_CURSORS": True,
        "OPTIONS": {
            "connect_timeout": 10,
            "isolation_level": 2,  # psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED
            **dict(parse_qsl(tmp_postgres.query)),
        },
    }
}

# ---------------------------------------------------------------------------
# Security hardening
# ---------------------------------------------------------------------------
def _env_bool(name, default):
    return config(name, default=str(default)).lower() in ("true", "1", "yes")

# Render terminates TLS at its proxy and forwards requests to Django.
# Trust X-Forwarded-Proto so Django can determine whether the original
# request was HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT            = _env_bool("SECURE_SSL_REDIRECT", True)
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SESSION_COOKIE_SECURE          = _env_bool("SESSION_COOKIE_SECURE", True)
SESSION_COOKIE_HTTPONLY        = True
SESSION_COOKIE_SAMESITE        = "Lax"
CSRF_COOKIE_SECURE             = _env_bool("CSRF_COOKIE_SECURE", True)
CSRF_COOKIE_HTTPONLY           = True
CSRF_COOKIE_SAMESITE           = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF    = True
SECURE_REFERRER_POLICY         = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS                = "DENY"

# Bound request parsing costs. Larger media uploads should go directly to the
# object store instead of being buffered in the web process.
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config("CORS_ALLOWED_ORIGINS", default="").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in config(
        "CSRF_TRUSTED_ORIGINS",
        default=config("CORS_ALLOWED_ORIGINS", default=""),
    ).split(",")
    if origin.strip()
]

# ---------------------------------------------------------------------------
# Static files — WhiteNoise serves them efficiently
# ---------------------------------------------------------------------------
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
# Media files — Cloudflare R2 (S3-compatible)
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
}

R2_ACCOUNT_ID = config("R2_ACCOUNT_ID")
R2_PUBLIC_URL = config("R2_PUBLIC_URL").rstrip("/")
AWS_ACCESS_KEY_ID = config("R2_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = config("R2_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = config("R2_BUCKET_NAME")
AWS_S3_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
AWS_S3_REGION_NAME = "auto"
AWS_S3_CUSTOM_DOMAIN = R2_PUBLIC_URL.removeprefix("https://").removeprefix("http://")
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH  = False
AWS_S3_ADDRESSING_STYLE = "path"
# Uploaded media names are UUID-based (see core.utils.files), so a URL never
# changes its contents. Let browsers and Cloudflare's media.hovuca.org CDN keep
# those immutable objects for a year instead of revalidating them every day.
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "public, max-age=31536000, immutable",
}

# A single Gunicorn process does not need external cache/channel infrastructure.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


# ---------------------------------------------------------------------------
# Sentry — error tracking
# ---------------------------------------------------------------------------
sentry_sdk.init(
    dsn=config("SENTRY_DSN", default=""),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.2,
    send_default_pii=False,
)
