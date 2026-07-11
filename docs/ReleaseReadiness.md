# MedClaro Release Readiness Plan

## Purpose

This document defines the release-readiness baseline for MedClaro. It covers
testing, security hardening, deployment, observability, backup and restore, and
final first-release gates.

## Test Strategy

### Backend

Run:

```bash
python manage.py test --settings=medclaro_api.test_settings
```

Coverage requirements:

- Accounts: registration, login, logout, current user, and unauthenticated access.
- Profiles: create, update, AI context, privacy consent, and owner scope.
- Documents: upload validation, owner scope, preview/download access, and soft delete.
- Report analysis: owner-scoped document validation, mocked report output, safety review metadata, and document status handoff.
- Trends: report history, timeline refresh, trend generation, and non-diagnostic risk awareness.
- Prescriptions: owner-scoped prescription validation, mocked medication extraction, duplicate/allergy warnings, expiry warnings, and reminder planning.
- Health Hub: dashboard aggregation, assistant context, sensitive intent flags, and assistant guardrail language.
- Daily Health: symptoms, journal, lifestyle plans, urgent symptom safety notes, and timeline events.
- Family Care: circle creation, invitations, permission grants, revocation, doctor summaries, emergency shares, expiry, and public access blocking.
- Accessibility: preference defaults, localization artifacts, voice planning, and simplified dashboard.
- Future Modules: roadmap, vaccination reminders, Second Opinion guardrails, owner scope, and integration boundaries.
- Release Readiness: readiness plan authentication, Gemini boundary validation, cross-user access denial, and production security toggles.

### Frontend

Run:

```bash
npm.cmd run build
```

Critical flows to cover with browser tests before production:

- Profile onboarding.
- Medical Vault upload and document list.
- Report analysis request and result display.
- Health Hub dashboard and assistant response.
- Daily symptom, journal, and lifestyle plan flows.
- Family invite, doctor summary, emergency share, and revoke flows.
- Accessibility preferences and simplified dashboard.
- Future Modules roadmap and planning surfaces.
- Release Readiness plan surface.

Recommended tooling:

- Playwright for end-to-end flows.
- React Testing Library for form and component behavior.

## AI Mock Test Strategy

- Keep deterministic mocked services for repeatable tests.
- Preserve separate Gemini module configs for report analysis, prescriptions, health assistant, trends, diet/exercise, translation, doctor summary, and safety review.
- Assert model name and prompt version on AI-generated artifacts.
- Assert safety language for critical markers, urgent symptoms, overdose, allergic reaction, breathing trouble, self-harm language, and Second Opinion requests.
- Treat live provider failures as observable events, not silent failures.

## Permission And Access Tests

Required checks:

- Protected endpoints reject unauthenticated requests.
- Users cannot list, retrieve, update, delete, analyze, or summarize records owned by another user.
- Soft-deleted documents are excluded from lists and future AI handoff.
- Family permission revocation disables active grants immediately.
- Emergency public shares expire and revoked shares are blocked.
- Partner integrations remain behind explicit consent and audit events.

## Security Hardening Checklist

- Set `DJANGO_DEBUG=False` outside local development.
- Use a high-entropy `DJANGO_SECRET_KEY` from the secret manager.
- Set exact `DJANGO_ALLOWED_HOSTS`.
- Set exact `DJANGO_CORS_ALLOWED_ORIGINS`.
- Set `DJANGO_CSRF_TRUSTED_ORIGINS` for browser-hosted production domains.
- Enable `DJANGO_SECURE_SSL_REDIRECT=True` behind HTTPS.
- Enable `DJANGO_SESSION_COOKIE_SECURE=True`.
- Enable `DJANGO_CSRF_COOKIE_SECURE=True`.
- Set `DJANGO_SECURE_HSTS_SECONDS=31536000` after HTTPS is confirmed.
- Enable HSTS subdomains and preload only after domain-wide HTTPS is stable.
- Use `DJANGO_SECURE_PROXY_SSL_HEADER=True` only behind a trusted proxy that sets `X-Forwarded-Proto`.
- Do not log raw document contents, auth tokens, API keys, or full AI context snapshots.
- Review dependency audit findings before production.

## Observability Plan

Track these events:

- API errors.
- Authentication failures.
- Permission failures.
- Upload failures.
- Document processing failures.
- AI provider failures.
- Long-running task timeouts.
- Family permission revocations.
- Emergency share access.

Minimum alerts:

- Elevated 5xx API error rate.
- Repeated permission failures for one user or IP.
- Upload failure spike.
- AI provider timeout, quota, or auth failure.
- Emergency share access anomaly.
- Long-running task backlog.

## Deployment Plan

Environments:

- Local.
- Staging.
- Production.

Backend:

- Use PostgreSQL in staging and production.
- Run migrations before deployment.
- Serve Django behind a TLS-aware reverse proxy.
- Use environment variables or a secret manager for all secrets.
- Move media uploads to production object storage before real users.

Frontend:

- Build with `NEXT_PUBLIC_API_URL` set to the matching API environment.
- Deploy only successful production builds.
- Smoke-test key pages after deployment.

Secrets:

- `DATABASE_PASSWORD`
- `DJANGO_SECRET_KEY`
- Gemini API keys per module.
- Storage credentials.
- Monitoring provider credentials.

## Backup And Restore

PostgreSQL:

- Automated daily backups.
- Point-in-time recovery where the deployment platform supports it.
- Encrypted backup storage.
- Monthly restore drill into isolated staging.

Media storage:

- Versioned object storage for medical documents.
- Retention and deletion policies aligned with user deletion and document soft-delete rules.
- Restore test for both database records and associated files.

## User-Facing Disclaimers

Medical:

MedClaro provides educational health organization and discussion support. It
does not diagnose, prescribe, or replace qualified medical care.

Privacy:

Users should share health records only with trusted people. Family, doctor,
emergency, and partner access must be explicit, revocable, and auditable.

Urgent care:

For severe symptoms, emergencies, or rapidly worsening conditions, users should
contact local emergency services or a qualified clinician immediately.

## First-Release Checklist

- [ ] All Django tests pass.
- [ ] Next.js production build passes.
- [ ] PostgreSQL migrations run in staging.
- [ ] Production secrets configured.
- [ ] Production object storage configured.
- [ ] CORS, CSRF, allowed hosts, HTTPS, cookies, and HSTS reviewed.
- [ ] Monitoring alerts configured.
- [ ] Backup restore drill completed.
- [ ] Dependency audit reviewed.
- [ ] Medical and privacy disclaimers reviewed.
- [ ] Emergency access behavior reviewed.
- [ ] Release rollback plan documented.
