# Phase 01 - Foundation, Architecture, and Environment

## Objectives

- Establish the technical foundation for MedClaro.
- Define frontend, backend, database, AI, security, and deployment architecture.
- Prepare the project for scalable module-by-module development.
- Plan the use of separate Gemini model instances and API keys per feature.

## Features to Build

- Next.js frontend application structure.
- Django + Django REST Framework backend structure.
- PostgreSQL database configuration.
- Local database planning for `medclaro` with password `shivamyadav`.
- Environment variable strategy for database, secrets, and Gemini API keys.
- Base authentication architecture.
- Base API response and error-handling conventions.
- Medical disclaimer and AI safety policy foundation.
- Audit logging strategy for sensitive health actions.

## Development Tasks

- Define frontend route groups and application layout strategy.
- Define backend app/module boundaries.
- Plan PostgreSQL schema organization and migration workflow.
- Document `.env` requirements for local and production environments.
- Design separate AI service clients for report analysis, prescriptions, health assistant, trends, translation, doctor summaries, and safety review.
- Define API versioning strategy.
- Define file upload limits, allowed document types, and storage boundaries.
- Define logging, monitoring, and error reporting expectations.
- Define medical safety language that all AI modules must follow.

## Dependencies

- Project requirements.
- `Description.md` product ecosystem.
- `Design.txt` module breakdown.
- PostgreSQL installed locally.
- Gemini API access for `gemini-3.1-flash-lite`.

## Expected Deliverables

- Confirmed technical architecture.
- Environment variable plan.
- Backend module boundary plan.
- Frontend module boundary plan.
- AI client separation plan.
- Security and privacy baseline.
- Initial database planning notes.

## Implementation Notes

- Backend scaffold is in `backend` using Django, DRF, CORS support, PostgreSQL
  environment configuration, and `/api/v1` route versioning.
- Frontend scaffold is in `frontend` using Next.js App Router, Tailwind CSS, and
  a starter Health Hub shell.
- Shared environment requirements are documented in `.env.example`.
- Detailed baseline architecture and API conventions are documented in
  `docs/Architecture.md`.
- Gemini module separation is represented in
  `backend/ai_services/gemini_config.py`.

## Completion Checklist

- [x] Frontend architecture is defined.
- [x] Backend architecture is defined.
- [x] PostgreSQL local setup is documented.
- [x] `.env` variable strategy is documented.
- [x] Gemini model instance separation is documented.
- [x] Security baseline is documented.
- [x] AI safety baseline is documented.
- [x] Initial API and module conventions are agreed.
