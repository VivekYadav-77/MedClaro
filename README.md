# MedClaro

MedClaro is a full-stack personal health intelligence platform for organizing health profiles, medical documents, report analysis, prescription intelligence, timelines, family care, accessibility planning, future ecosystem modules, and release-readiness workflows.

The project is built as a Django REST Framework API with a Next.js App Router frontend. Current AI-powered features use deterministic mocked outputs so the product can be tested locally without live Gemini calls, while preserving separate Gemini configuration boundaries for production integration.

## Current Status

Phase 12 is complete. The repository includes:

- Django REST Framework backend under `backend`.
- Next.js frontend under `frontend`.
- Token-based authentication.
- Personal Health Profile APIs.
- Medical Vault document upload and soft-delete APIs.
- Mocked report analysis and biomarker storage.
- Health timeline, trend, and risk-awareness APIs.
- Mocked prescription and medication intelligence.
- Health Hub and contextual assistant planning.
- Daily health, symptom, journal, diet, and exercise planning.
- Family Care, Doctor Mode, and Emergency Mode planning.
- Accessibility, multilingual, voice, and senior mode planning.
- Future modules roadmap and ecosystem planning.
- Release readiness planning for tests, security, deployment, monitoring, backups, and disclaimers.

## Tech Stack

### Backend

- Python
- Django
- Django REST Framework
- DRF token authentication
- PostgreSQL for local application data
- SQLite for test runs through `medclaro_api.test_settings`

### Frontend

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Lucide React icons

### AI Boundary

- Planned model: `gemini-3.1-flash-lite`
- Separate Gemini environment variables per module:
  - report analysis
  - prescription intelligence
  - health assistant
  - trends
  - diet/exercise
  - translation
  - doctor summary
  - safety review

## Project Structure

```text
MedClaro/
|-- backend/
|   |-- accounts/
|   |-- accessibility/
|   |-- ai_services/
|   |-- audit/
|   |-- daily_health/
|   |-- documents/
|   |-- family_care/
|   |-- future_modules/
|   |-- health_hub/
|   |-- health_profiles/
|   |-- health_trends/
|   |-- medication_intelligence/
|   |-- medclaro_api/
|   |-- release_readiness/
|   `-- report_analysis/
|-- docs/
|   |-- Architecture.md
|   |-- MasterPlan.md
|   |-- Phase-01.md ... Phase-12.md
|   |-- Progress.md
|   `-- ReleaseReadiness.md
|-- frontend/
|   |-- app/
|   |-- lib/
|   `-- package.json
|-- .env.example
`-- README.md
```

## Prerequisites

Install these before running the app:

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- PostgreSQL

Create a local PostgreSQL database:

```sql
CREATE DATABASE medclaro;
```

The default local credentials in `.env.example` use:

```env
DATABASE_NAME=medclaro
DATABASE_USER=postgres
DATABASE_PASSWORD=shivamyadav
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

Update these values in `.env` if your PostgreSQL setup is different.

## Environment Setup

From the project root:

```powershell
Copy-Item .env.example .env
```

For local development, keep:

```env
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Gemini API keys can stay empty for local testing because current AI behavior is deterministic and mocked.

## Run Locally

Use two PowerShell windows: one for the backend and one for the frontend.

### 1. Backend

From the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Health check:

[http://127.0.0.1:8000/api/v1/health/](http://127.0.0.1:8000/api/v1/health/)

Expected response:

```json
{
  "status": "ok",
  "service": "medclaro-api",
  "version": "v1"
}
```

### 2. Frontend

Open a second PowerShell window:

```powershell
cd "D:\web devfiles\MedClaro\MedClaro\frontend"
npm install
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

[http://127.0.0.1:3000](http://127.0.0.1:3000)

If port `3000` is busy:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3002
```

Then open:

[http://127.0.0.1:3002](http://127.0.0.1:3002)

## Create A Local API Token

Most app pages need a DRF token. Register a local user:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/v1/accounts/register/" `
  -ContentType "application/json" `
  -Body '{"username":"testuser","email":"test@example.com","password":"test-password-123"}'
```

Copy the returned `token` and paste it into the token field on protected frontend pages.

If the user already exists, log in instead:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/v1/accounts/login/" `
  -ContentType "application/json" `
  -Body '{"username":"testuser","password":"test-password-123"}'
```

## Frontend Pages

- `/` - main dashboard
- `/profile` - Personal Health Profile
- `/documents` - Medical Vault
- `/reports` - report analysis
- `/trends` - timeline and health trends
- `/prescriptions` - prescription intelligence
- `/hub` - Health Hub and assistant
- `/daily` - symptoms, journal, lifestyle planning
- `/family` - Family Care, Doctor Mode, Emergency Mode
- `/accessibility` - language, voice, senior mode
- `/future` - future modules and ecosystem roadmap
- `/readiness` - testing, security, deployment, monitoring, backup, and release readiness

## API Surface

Base URL:

```text
http://127.0.0.1:8000/api/v1
```

Main API groups:

- `/accounts/`
- `/profiles/`
- `/documents/`
- `/report-analyses/`
- `/health-trends/`
- `/prescriptions/`
- `/health-hub/`
- `/daily-health/`
- `/family-care/`
- `/accessibility/`
- `/future-modules/`
- `/release-readiness/`

## Run Tests

Backend tests use SQLite through `medclaro_api.test_settings`:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py test --settings=medclaro_api.test_settings
```

Frontend production build:

```powershell
cd frontend
npm.cmd run build
```

## Production Readiness Notes

Before serving real users:

- Set `DJANGO_DEBUG=False`.
- Use a strong `DJANGO_SECRET_KEY`.
- Configure exact allowed hosts, CORS origins, and CSRF trusted origins.
- Enable HTTPS redirect, secure cookies, and HSTS after TLS is confirmed.
- Choose production object storage for uploaded medical documents.
- Choose monitoring and alerting providers.
- Configure PostgreSQL backups and run a restore drill.
- Review dependency audit findings.
- Review `docs/ReleaseReadiness.md`.

## Medical Safety Notice

MedClaro provides educational health organization and doctor-discussion support. It does not diagnose, prescribe, or replace qualified medical care. For severe symptoms, emergencies, or rapidly worsening conditions, contact local emergency services or a qualified clinician immediately.

## Useful Docs

- [MasterPlan.md](docs/MasterPlan.md)
- [Architecture.md](docs/Architecture.md)
- [Progress.md](docs/Progress.md)
- [ReleaseReadiness.md](docs/ReleaseReadiness.md)
- [Phase-12.md](docs/Phase-12.md)
