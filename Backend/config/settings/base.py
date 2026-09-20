from datetime import timedelta
from pathlib import Path

from decouple import config
from django.templatetags.static import static
from django.utils.translation import gettext_lazy as _

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
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "axes",
    "django_ckeditor_5",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "storages",
    "channels",
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
    "core.middleware.SecurityResponseHeadersMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
]

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation.MinimumLengthValidator"
        ),
        "OPTIONS": {"min_length": 12},
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation.CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation.NumericPasswordValidator"
        ),
    },
]

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
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "user": "600/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_MINUTES", default=15, cast=int),),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_DAYS", default=7, cast=int),),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "CHECK_REVOKE_TOKEN": True,
}

# Database-backed authentication lockout protects both the Django admin and
# API login. A username/IP pair is locked temporarily after repeated failures.
AXES_FAILURE_LIMIT = config("AXES_FAILURE_LIMIT", default=5, cast=int)
AXES_COOLOFF_TIME = timedelta(
    minutes=config("AXES_COOLOFF_MINUTES", default=30, cast=int)
)
AXES_LOCKOUT_PARAMETERS = [["username", "ip_address"]]
AXES_RESET_ON_SUCCESS = True
AXES_HTTP_RESPONSE_CODE = 429
AXES_ENABLE_RETRY_AFTER_HEADER = True
AXES_CLIENT_IP_CALLABLE = "core.security.get_client_ip"
AXES_LOCKOUT_CALLABLE = "core.security.lockout_response"
TRUSTED_PROXY_COUNT = config("TRUSTED_PROXY_COUNT", default=1, cast=int)

# ---------------------------------------------------------------------------
# Channels (WebSockets)
# ---------------------------------------------------------------------------
WEBSOCKET_TICKET_LIFETIME = config(
    "WEBSOCKET_TICKET_LIFETIME", default=30, cast=int
)

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(config("REDIS_HOST", default="127.0.0.1"), 6379)],
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

CKEDITOR_5_FILE_UPLOAD_PERMISSION = "staff"
CKEDITOR_5_MAX_FILE_SIZE = 5
CKEDITOR_5_UPLOAD_FILE_TYPES = ["jpeg", "jpg", "png", "gif", "webp"]
CKEDITOR_5_CONFIGS = {
    "hovuca": {
        "toolbar": {
            "items": [
                "undo", "redo", "findAndReplace", "|", "heading", "fontFamily",
                "fontSize", "|", "bold", "italic", "underline", "strikethrough",
                "code", "subscript", "superscript", "removeFormat", "|",
                "fontColor", "fontBackgroundColor", "highlight", "|", "alignment",
                "bulletedList", "numberedList", "outdent", "indent", "|", "link",
                "blockQuote", "codeBlock", "insertImage", "mediaEmbed", "insertTable",
                "horizontalLine", "pageBreak", "specialCharacters", "|",
                "sourceEditing",
            ],
            "shouldNotGroupWhenFull": True,
        },
        "fontFamily": {"supportAllValues": True},
        "fontSize": {
            "options": [9, 11, 13, "default", 17, 20, 24, 30, 36],
            "supportAllValues": True,
        },
        "image": {
            "toolbar": [
                "imageTextAlternative", "toggleImageCaption", "|",
                "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight",
                "|", "imageStyle:inline", "imageStyle:wrapText", "imageStyle:breakText",
                "|", "resizeImage",
            ],
            "resizeOptions": [
                {"name": "resizeImage:original", "label": "Original"},
                {"name": "resizeImage:25", "value": "25", "label": "25%"},
                {"name": "resizeImage:50", "value": "50", "label": "50%"},
                {"name": "resizeImage:75", "value": "75", "label": "75%"},
            ],
        },
        "table": {
            "contentToolbar": [
                "tableColumn", "tableRow", "mergeTableCells", "tableProperties",
                "tableCellProperties",
            ],
        },
        "height": "400px",
        "width": "100%",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Unfold admin
# ---------------------------------------------------------------------------
UNFOLD = {
    "SITE_TITLE": _("HOVUCA Admin"),
    "SITE_HEADER": _("HOVUCA"),
    "SITE_SUBHEADER": _("Site operations"),
    "SITE_ICON": lambda request: static("admin/favicon.ico"),
    "SITE_FAVICONS": [
        {
            "rel": "icon",
            "sizes": "any",
            "type": "image/x-icon",
            "href": lambda request: static("admin/favicon.ico"),
        },
    ],
    "DASHBOARD_CALLBACK": "core.admin_dashboard.dashboard_callback",
    "STYLES": [lambda request: static("admin/dashboard.css")],
    "SCRIPTS": [lambda request: static("admin/navigation.js")],
    "SIDEBAR": {
        "show_search": True,
        "navigation": "core.admin_navigation.sidebar_navigation",
    },
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
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAdminUser"],
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
DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL",
    default=RESEND_FROM or "HOVUCA <noreply@localhost>",
)
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000").rstrip("/")
CONTACT_FORM_RECIPIENT = config(
    "CONTACT_FORM_RECIPIENT", default="contact@hovuca.org"
)

TASKS = {
    "default": {
        "BACKEND": "django.tasks.backends.immediate.ImmediateBackend",
        "QUEUES": ["default", "accounts", "payments", "certificates"],
    },
}




# Payment providers. Individual storefronts can override these through a
# provider-account model later; these defaults preserve the existing gateways.

# Branding vars injected into every templates/emails/*.html render.
