# MedClaro Backend

Django + Django REST Framework API for MedClaro.

## Local Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

The local database defaults to PostgreSQL database `medclaro`.
Copy the root `.env.example` to `.env` before running the server.

## App Boundaries

- `accounts`: authentication, user profile, preferences.
- `health_profiles`: durable Personal Health Profile context.
- `documents`: secure medical document metadata and upload lifecycle.
- `ai_services`: isolated Gemini client configuration and safety wrappers.
- `audit`: sensitive access and mutation logging.
