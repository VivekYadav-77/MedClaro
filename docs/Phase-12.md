# Phase 12 - Testing, Security Hardening, Deployment, and Release Readiness

## Objectives

- Prepare MedClaro for reliable release.
- Validate privacy, permissions, AI safety, and critical user workflows.
- Establish deployment and production readiness practices.

## Features to Build

- Backend automated tests.
- Frontend critical-flow tests.
- AI service tests with mocked responses.
- Permission and access-control tests.
- Security hardening.
- Audit log review.
- Error monitoring.
- Deployment pipeline.
- Release checklist.
- User-facing medical and privacy disclaimers.

## Development Tasks

- Define backend test coverage for models, serializers, services, permissions, and APIs.
- Define frontend test coverage for onboarding, upload, analysis, dashboard, assistant, family sharing, doctor export, and emergency mode.
- Mock Gemini responses for repeatable tests.
- Test separate Gemini client configuration.
- Test unauthorized access boundaries.
- Test family permission revocation.
- Test document deletion and access rules.
- Test AI safety behavior for critical markers and concerning symptoms.
- Define observability requirements:
  - API errors.
  - AI failures.
  - Upload failures.
  - Long-running tasks.
  - Permission failures.
- Define deployment environments.
- Define backup and restore strategy for PostgreSQL.
- Define production secrets management.
- Create release checklist.

## Dependencies

- All prior phases.
- Final module scope for first release.
- Deployment platform decision.
- Production storage decision.
- Monitoring provider decision.

## Expected Deliverables

- Testing strategy.
- Security hardening checklist.
- Deployment plan.
- Monitoring plan.
- Backup and restore plan.
- First-release readiness checklist.

## Implementation Notes

- Added `release_readiness` Django app for release planning and validation.
- Added authenticated API under `/api/v1/release-readiness/plan/` with:
  - Backend test strategy.
  - Frontend critical-flow test strategy.
  - AI mocked-response test strategy.
  - Permission and access-control test requirements.
  - Security hardening checklist.
  - Observability and monitoring plan.
  - Deployment plan.
  - Production secrets plan.
  - PostgreSQL and media backup/restore plan.
  - Medical, privacy, and urgent-care disclaimer language.
  - First-release checklist.
- Added production hardening settings controlled by environment variables:
  - `DJANGO_CSRF_TRUSTED_ORIGINS`
  - `DJANGO_SECURE_SSL_REDIRECT`
  - `DJANGO_SESSION_COOKIE_SECURE`
  - `DJANGO_CSRF_COOKIE_SECURE`
  - `DJANGO_SECURE_HSTS_SECONDS`
  - `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS`
  - `DJANGO_SECURE_HSTS_PRELOAD`
  - `DJANGO_SECURE_PROXY_SSL_HEADER`
- Added release-readiness tests for authenticated access, deliverable coverage, separate Gemini configuration boundaries, cross-user document denial, family permission revocation, and production security toggles.
- Added frontend Release Readiness page at `/readiness` and linked it from the dashboard.
- Added detailed release-readiness documentation in `docs/ReleaseReadiness.md`.
- Provider-specific deployment, monitoring, storage, and backup tooling remain open until production platform choices are finalized.

## Completion Checklist

- [x] Backend test plan is complete.
- [x] Frontend test plan is complete.
- [x] AI mock test plan is complete.
- [x] Permission tests are defined.
- [x] Security checklist is complete.
- [x] Deployment plan is complete.
- [x] Monitoring plan is complete.
- [x] Backup strategy is complete.
- [x] Release checklist is complete.
