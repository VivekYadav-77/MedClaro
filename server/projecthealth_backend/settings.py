import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


SECRET_KEY = env("DJANGO_SECRET_KEY", env("JWT_SECRET", "change-me")) or "change-me"
DEBUG = env_bool("DJANGO_DEBUG", env("APP_ENV", "development") != "production")
ALLOWED_HOSTS = [host.strip() for host in (env("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost") or "").split(",") if host.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "users",
    "reports",
    "reminders",
    "circles",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "projecthealth_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "projecthealth_backend.wsgi.application"
ASGI_APPLICATION = "projecthealth_backend.asgi.application"

DATABASE_ENGINE = env("DB_ENGINE", "sqlite")
if DATABASE_ENGINE == "postgres":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", "projecthealth"),
            "USER": env("DB_USER", "postgres"),
            "PASSWORD": env("DB_PASSWORD", ""),
            "HOST": env("DB_HOST", "localhost"),
            "PORT": env("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "OPTIONS": {
                "init_command": "PRAGMA journal_mode=WAL",
            },
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = env("TIME_ZONE", "UTC") or "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.authentication.BearerTokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "projecthealth_backend.exceptions.api_exception_handler",
}

CORS_ALLOW_CREDENTIALS = True
DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
configured_frontend_origins = [
    origin.strip()
    for origin in ",".join(
        [
            env("FRONTEND_URL", "") or "",
            env("FRONTEND_URLS", "") or "",
        ]
    ).split(",")
    if origin.strip()
]
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([*DEFAULT_FRONTEND_ORIGINS, *configured_frontend_origins]))

APP_NAME = env("APP_NAME", "MedClaro API") or "MedClaro API"
API_V1_PREFIX = env("API_V1_PREFIX", "/api") or "/api"
JWT_SECRET = env("JWT_SECRET", "change-me") or "change-me"
JWT_ALGORITHM = env("JWT_ALGORITHM", "HS256") or "HS256"
JWT_EXPIRY_MINUTES = int(env("JWT_EXPIRY_MINUTES", "60") or "60")
APP_ENCRYPTION_KEY = env("APP_ENCRYPTION_KEY", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") or ""
GEMINI_DEFAULT_MODEL = env("GEMINI_DEFAULT_MODEL", "gemini-3.1-flash-lite-preview") or "gemini-3.1-flash-lite-preview"
GEMINI_API_KEY = env("GEMINI_API_KEY", "") or ""
GEMINI_API_KEY_EXTRACTION = env("GEMINI_API_KEY_EXTRACTION", GEMINI_API_KEY) or ""
GEMINI_API_KEY_ANALYSIS = env("GEMINI_API_KEY_ANALYSIS", GEMINI_API_KEY) or ""
GEMINI_API_KEY_CHAT = env("GEMINI_API_KEY_CHAT", GEMINI_API_KEY) or ""
GEMINI_API_KEY_FEATURES = env("GEMINI_API_KEY_FEATURES", GEMINI_API_KEY) or ""
GEMINI_MODEL_TEXT = env("GEMINI_MODEL_TEXT", GEMINI_DEFAULT_MODEL) or GEMINI_DEFAULT_MODEL
GEMINI_MODEL_VISION = env("GEMINI_MODEL_VISION", GEMINI_DEFAULT_MODEL) or GEMINI_DEFAULT_MODEL
GEMINI_MODEL_CHAT = env("GEMINI_MODEL_CHAT", GEMINI_DEFAULT_MODEL) or GEMINI_DEFAULT_MODEL
GEMINI_MODEL_FEATURES = env("GEMINI_MODEL_FEATURES", GEMINI_DEFAULT_MODEL) or GEMINI_DEFAULT_MODEL

ALLOWED_FILE_TYPES = tuple(
    item.strip()
    for item in (env("ALLOWED_FILE_TYPES", "application/pdf,image/jpeg,image/png") or "").split(",")
    if item.strip()
)
MAX_UPLOAD_SIZE_BYTES = int(env("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024)) or str(10 * 1024 * 1024))
UPLOAD_LIMIT_PER_DAY = int(env("UPLOAD_LIMIT_PER_DAY", "5") or "5")
CHAT_LIMIT_PER_DAY = int(env("CHAT_LIMIT_PER_DAY", "20") or "20")
