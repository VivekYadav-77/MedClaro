# MedClaro

MedClaro is a full-stack personal health intelligence starter built from the provided product plan. It includes a Next.js 14 frontend, a Django + Django REST Framework backend, Gemini prompt templates, file-storage hooks for signed-object access, and the core UX for uploads, explanations, timelines, trends, chat, prescription decoding, reminders, and multilingual settings.

## Stack

- Frontend: Next.js 14 App Router, Tailwind CSS, shadcn-style UI primitives, NextAuth.js, next-intl, Recharts
- Backend: Django 5, Django REST Framework, relational database models
- AI: Google Gemini `gemini-1.5-flash` prompt layer with scoped system prompts and jailbreak filtering
- Storage: AWS S3 or Cloudflare R2 via presigned URLs only
- Parsing: `pdfplumber` for PDFs and Gemini Vision OCR for images

## Project Structure

```text
backend/
  manage.py
  projecthealth_backend/ # Django project settings, urls, auth helpers
  users/                 # Custom user model, auth callback, profile, family
  reports/               # Report models, upload, trends, chat, summary
  reminders/             # Reminder models and endpoints
  app/                   # Legacy FastAPI source retained during migration
frontend/
  app/                 # Next.js pages and layouts
  components/          # Layout, dashboard, report, and UI components
  lib/                 # Auth config, API layer, i18n, mock fallback data
  messages/            # UI translations
```

## Backend Highlights

- JWT-protected API routes for every non-auth endpoint
- AES-256-GCM application-level encryption for sensitive report payloads and stored user email
- Upload validation with MIME checking, size limits, and `python-magic`
- Prompt-injection defenses:
  - instruction-pattern stripping from extracted report text
  - report data delimiter wrapping
  - strict system prompt limited to report content
- Per-user rate limits for uploads and report chat
- Report normalization helpers for trend-safe comparisons
- AI fallback queue table when Gemini is unavailable

### Implemented Routes

- `POST /api/auth/callback`
- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `POST /api/reports/upload`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `DELETE /api/reports/{id}`
- `POST /api/reports/{id}/chat`
- `GET /api/reports/{id}/chat`
- `GET /api/reports/trends`
- `POST /api/reports/{id}/summary`
- `GET /api/family`
- `POST /api/family`
- `DELETE /api/family/{id}`
- `POST /api/reminders`
- `PUT /api/reminders/{id}/mute`

## Frontend Highlights

- Mobile-first calm UI with soft blue-green palette and non-alarming language
- Dashboard timeline grouped by year
- Upload flow with progress steps
- Report detail page with layered explanations, voice readout, summary generation, and report-scoped chat
- Trend charts using normalized values and shaded reference ranges
- Family switcher in the navbar
- Settings page with language and privacy controls
- Auto logout after 15 minutes of inactivity

## Gemini Prompt Templates

Prompt templates are written explicitly in:

- [`backend/app/services/prompts.py`](/D:/web%20devfiles/ProjectHealth/backend/app/services/prompts.py)
- [`backend/app/services/ai.py`](/D:/web%20devfiles/ProjectHealth/backend/app/services/ai.py)
- [`backend/app/services/parser.py`](/D:/web%20devfiles/ProjectHealth/backend/app/services/parser.py)

They cover:

- system-level medical scope and delimiter instructions
- structured parameter extraction
- image OCR
- report explanation
- report chat
- prescription decoding
- pre-appointment summary generation

## Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 3. Environment

- Copy [`.env.example`](/D:/web%20devfiles/ProjectHealth/.env.example) to `.env`
- Fill in database, Gemini, Google OAuth, and S3/R2 credentials
- Keep `NEXT_PUBLIC_API_URL` pointed at `http://localhost:8000/api`

## Notes

- The frontend currently falls back to mock data when `NEXT_PUBLIC_API_URL` is not set, which makes the UI explorable before the backend is wired to live auth tokens.
- File deletion is hard delete for report objects and account cleanup.
- `python-magic` can require native support on Windows; if needed, install the matching system package or swap to the platform-appropriate binary distribution while keeping server-side true-file validation.
- Email reminders and retry workers are scaffold-ready through the `reminders` and `analysis_queue` tables, but a background scheduler/worker should be added before production deployment.
