from ai_services.gemini_config import GEMINI_MODULES


CRITICAL_BACKEND_FLOWS = [
    {
        "area": "identity",
        "coverage": ["registration", "login", "logout", "current user", "token auth rejection"],
        "status": "covered_and_expand",
    },
    {
        "area": "profile",
        "coverage": ["profile create/update", "AI context bounds", "privacy consent"],
        "status": "covered_and_expand",
    },
    {
        "area": "documents",
        "coverage": ["upload validation", "owner scoping", "soft delete", "preview/download authorization"],
        "status": "covered_and_expand",
    },
    {
        "area": "ai_workflows",
        "coverage": ["report analysis", "prescriptions", "assistant", "lifestyle", "doctor summary"],
        "status": "mocked_repeatable",
    },
    {
        "area": "family_permissions",
        "coverage": ["invite", "permission grants", "revocation", "emergency share expiry"],
        "status": "covered_and_expand",
    },
]

FRONTEND_CRITICAL_FLOWS = [
    "Profile onboarding with token entry and saved profile state.",
    "Medical Vault upload, document listing, and delete state.",
    "Report analysis request, result display, and safety disclaimer.",
    "Health Hub dashboard, assistant turn, and alert rendering.",
    "Family Care invite, doctor summary, emergency share, and revoke states.",
    "Accessibility senior mode, language preferences, and voice planning.",
    "Future Modules and Release Readiness planning surfaces.",
]

OBSERVABILITY_EVENTS = [
    "api_error",
    "authentication_failure",
    "permission_denied",
    "upload_failure",
    "ai_provider_failure",
    "long_running_task_timeout",
    "document_processing_failure",
    "family_access_revoked",
    "emergency_share_accessed",
]

SECURITY_CHECKLIST = [
    "Set DJANGO_DEBUG=False for every non-local environment.",
    "Use a high-entropy DJANGO_SECRET_KEY stored only in the secret manager.",
    "Set exact DJANGO_ALLOWED_HOSTS and DJANGO_CORS_ALLOWED_ORIGINS per environment.",
    "Enable HTTPS redirects, secure cookies, HSTS, and proxy SSL headers behind TLS.",
    "Keep all protected APIs authenticated and owner scoped unless explicit permission grants apply.",
    "Audit sensitive document, family, doctor, emergency, and integration access.",
    "Keep AI prompts context-bounded and store model/prompt metadata for generated artifacts.",
    "Review dependency audit findings before production release.",
]

RELEASE_CHECKLIST = [
    {"item": "All Django tests pass", "owner": "backend", "required": True},
    {"item": "Next.js production build passes", "owner": "frontend", "required": True},
    {"item": "PostgreSQL migrations run in staging", "owner": "backend", "required": True},
    {"item": "Production media/object storage configured", "owner": "platform", "required": True},
    {"item": "Secrets loaded from environment or secret manager", "owner": "platform", "required": True},
    {"item": "Monitoring alerts configured for API, upload, AI, and permission failures", "owner": "platform", "required": True},
    {"item": "Backup restore drill completed", "owner": "platform", "required": True},
    {"item": "Medical and privacy disclaimers reviewed", "owner": "product", "required": True},
]


def build_release_readiness_plan() -> dict:
    return {
        "testing_strategy": {
            "backend": {
                "command": "python manage.py test --settings=medclaro_api.test_settings",
                "coverage_targets": CRITICAL_BACKEND_FLOWS,
                "permission_tests": [
                    "Unauthenticated protected endpoints return 401 or 403.",
                    "Users cannot list, retrieve, update, delete, or analyze records owned by another user.",
                    "Family permission revocation removes active grants immediately.",
                    "Emergency public shares expire and revoked shares return blocked responses.",
                    "Soft-deleted documents are excluded from user lists and downstream AI handoff.",
                ],
            },
            "frontend": {
                "command": "npm.cmd run build",
                "critical_flows": FRONTEND_CRITICAL_FLOWS,
                "recommended_tools": ["Playwright for browser flows", "React Testing Library for components"],
            },
            "ai_mocks": {
                "strategy": "Keep deterministic mocked outputs for repeatable tests while preserving module-specific Gemini config.",
                "modules": sorted(GEMINI_MODULES.keys()),
                "assertions": [
                    "Each AI artifact stores model name and prompt version.",
                    "Safety-sensitive inputs produce guardrail language.",
                    "Live provider failures map to planned observable failure events.",
                ],
            },
        },
        "security_hardening": {
            "checklist": SECURITY_CHECKLIST,
            "headers_and_cookies": [
                "DJANGO_SECURE_SSL_REDIRECT",
                "DJANGO_SESSION_COOKIE_SECURE",
                "DJANGO_CSRF_COOKIE_SECURE",
                "DJANGO_SECURE_HSTS_SECONDS",
            ],
            "data_access": "Owner scope remains default; family, doctor, emergency, and partner access require explicit grants or tokens.",
        },
        "observability_plan": {
            "events": OBSERVABILITY_EVENTS,
            "minimum_alerts": [
                "5xx API error rate above threshold",
                "Repeated permission denied events for one account",
                "Upload failure spike",
                "AI provider timeout or quota failure",
                "Emergency share access and revoke events",
            ],
            "logging_policy": "Never log raw medical document contents, full AI context snapshots, auth tokens, or API keys.",
        },
        "deployment_plan": {
            "environments": ["local", "staging", "production"],
            "backend": [
                "Run migrations before deploy.",
                "Serve Django behind TLS-aware reverse proxy.",
                "Use PostgreSQL in staging and production.",
                "Move media files to production object storage before real users.",
            ],
            "frontend": [
                "Build with NEXT_PUBLIC_API_URL pointing to the matching API environment.",
                "Deploy only successful production builds.",
            ],
            "secrets": [
                "DATABASE_PASSWORD",
                "DJANGO_SECRET_KEY",
                "Gemini API keys per module",
                "Storage credentials",
                "Monitoring provider keys",
            ],
        },
        "backup_restore_plan": {
            "postgresql": [
                "Automated daily backups with point-in-time recovery where supported.",
                "Encrypted backup storage with access limited to operators.",
                "Monthly restore drill into isolated staging database.",
            ],
            "media": [
                "Versioned object storage for uploaded medical documents.",
                "Retention and deletion policies aligned with account deletion and soft-delete rules.",
            ],
        },
        "disclaimers": {
            "medical": "MedClaro provides educational health organization and discussion support. It does not diagnose, prescribe, or replace qualified medical care.",
            "privacy": "Users should share health records only with trusted people. Family, doctor, emergency, and partner access must be explicit, revocable, and auditable.",
            "urgent_care": "For severe symptoms, emergencies, or rapidly worsening conditions, users should contact local emergency services or a qualified clinician immediately.",
        },
        "release_checklist": RELEASE_CHECKLIST,
    }
