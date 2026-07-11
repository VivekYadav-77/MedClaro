# MedClaro Architecture Baseline

## Runtime Shape

- Frontend: Next.js App Router in `frontend`.
- Backend: Django + Django REST Framework in `backend`.
- API version prefix: `/api/v1`.
- Database: PostgreSQL, local database `medclaro`.
- AI model default: `gemini-3.1-flash-lite`.

## Backend Modules

- `accounts`: authentication, account lifecycle, and user preferences.
- `health_profiles`: Personal Health Profile and AI context assembly.
- `documents`: medical vault metadata, upload lifecycle, ownership checks.
- `future_modules`: future ecosystem roadmap, vaccination, women's health, child growth, insurance, Second Opinion AI, education, wearable, and partner-boundary planning.
- `release_readiness`: testing, security hardening, monitoring, deployment, backup, disclaimer, and release checklist planning.
- `ai_services`: module-specific Gemini configuration and shared safety rules.
- `audit`: sensitive-access logging and future compliance records.

## API Conventions

Responses should be JSON only for API routes. Error responses should use:

```json
{
  "error": {
    "code": "string_code",
    "message": "Human readable message",
    "details": {}
  }
}
```

Protected records must be scoped by authenticated owner unless an explicit
permission grant allows family, doctor, caregiver, or emergency access.

## Phase 02 API Surface

- `POST /api/v1/accounts/register/`: create a user and return an auth token.
- `POST /api/v1/accounts/login/`: authenticate and return an auth token.
- `POST /api/v1/accounts/logout/`: revoke the current user's tokens.
- `GET /api/v1/accounts/me/`: return the authenticated user.
- `GET /api/v1/profiles/me/`: return the authenticated user's health profile.
- `POST /api/v1/profiles/`: create the authenticated user's health profile.
- `PUT/PATCH /api/v1/profiles/{id}/`: update the authenticated user's profile.
- `GET /api/v1/profiles/ai-context/`: return bounded profile context for AI modules.

Authentication uses DRF token authentication for the current foundation stage.

## Phase 03 API Surface

- `GET /api/v1/documents/`: list the authenticated user's non-deleted documents.
- `POST /api/v1/documents/`: upload a medical document with metadata.
- `GET /api/v1/documents/{id}/`: retrieve owned document metadata.
- `PATCH /api/v1/documents/{id}/`: update editable document metadata.
- `DELETE /api/v1/documents/{id}/`: soft-delete an owned document.
- `GET /api/v1/documents/{id}/status/`: retrieve processing status and handoff metadata.
- `GET /api/v1/documents/{id}/preview/`: stream an owned document for preview.
- `GET /api/v1/documents/{id}/download/`: download an owned document.

Supported upload extensions are PDF, PNG, JPG, JPEG, WEBP, DOC, and DOCX.
The local maximum upload size is configured with `DJANGO_MAX_UPLOAD_MB`.

## Phase 11 API Surface

- `GET /api/v1/future-modules/strategy/`: return roadmap, data extension strategy, education strategy, and advanced AI safety rules.
- `GET /api/v1/future-modules/roadmap/`: return seeded future module priorities.
- `GET/POST /api/v1/future-modules/vaccinations/`: list and create vaccination planning records with reminder rules.
- `GET/POST /api/v1/future-modules/womens-health/`: list and create women's health planning records.
- `GET/POST /api/v1/future-modules/children/`: list and create child growth profiles.
- `GET/POST /api/v1/future-modules/children/{child_id}/measurements/`: list and create child growth measurements.
- `GET/POST /api/v1/future-modules/insurance/`: list and create insurance policy metadata.
- `GET/POST /api/v1/future-modules/second-opinions/`: list and create Second Opinion AI doctor-discussion packets.
- `GET /api/v1/future-modules/education-library/`: return planned education content models.
- `GET/POST /api/v1/future-modules/wearables/`: list and create wearable integration plans.
- `GET /api/v1/future-modules/wearables/strategy/`: return wearable metrics and consent strategy.
- `GET /api/v1/future-modules/integration-boundaries/`: return hospital, pharmacy, appointment, and insurance integration boundaries.

## Phase 12 API Surface

- `GET /api/v1/release-readiness/plan/`: return testing strategy, security hardening checklist, deployment plan, monitoring plan, backup and restore plan, disclaimer language, and first-release readiness checklist.

## AI Client Separation

Each major AI feature has its own API key and model variable so modules can be
rotated, monitored, and rate-limited independently. The baseline mapping lives
in `backend/ai_services/gemini_config.py`.

## Medical Safety Baseline

AI output must:

- Educate and explain without diagnosing.
- Distinguish extracted report facts from AI interpretation.
- Recommend qualified medical care for concerning results.
- Escalate urgent symptoms or critical markers with clear care guidance.
- Store model name, module, prompt version, and generated timestamp once AI
  persistence is implemented.
