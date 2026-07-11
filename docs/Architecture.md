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
