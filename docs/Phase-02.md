# Phase 02 - Identity, Onboarding, and Personal Health Profile

## Objectives

- Build the identity and onboarding foundation.
- Create the Personal Health Profile that powers all future AI context.
- Capture demographic, lifestyle, medical, family, emergency, and language information.

## Features to Build

- User registration and login.
- User account management.
- Health profile onboarding.
- Profile completion progress.
- Preferred language selection.
- Food preference selection.
- Emergency contact capture.
- Known disease, allergy, and family history capture.
- Pregnancy-related profile fields when applicable.
- Profile update and review screens.

## Development Tasks

- Design user, account, and profile data models.
- Design health profile fields:
  - Age.
  - Gender.
  - Height.
  - Weight.
  - Blood group.
  - Occupation.
  - Smoking.
  - Alcohol.
  - Exercise.
  - Sleep.
  - Known diseases.
  - Allergies.
  - Family history.
  - Pregnancy status when applicable.
  - Emergency contact.
  - Preferred language.
  - Food preference.
  - Location.
- Plan profile validation rules.
- Plan profile edit history or audit requirements.
- Design onboarding UX for simple completion.
- Define how health profile context is passed to AI modules.
- Add privacy messaging for health data collection.

## Dependencies

- Phase 01 architecture.
- Authentication foundation.
- PostgreSQL schema migration workflow.
- Medical privacy and consent language.

## Expected Deliverables

- User identity plan.
- Personal Health Profile schema plan.
- Onboarding flow plan.
- Profile API contract plan.
- Frontend profile screens plan.
- AI context contract for profile data.

## Implementation Notes

- Registration, login, logout, and current-user APIs are implemented in
  `backend/accounts`.
- Token authentication is enabled through Django REST Framework.
- Personal Health Profile models are implemented in `backend/health_profiles`
  with related records for allergies, known conditions, family history, and
  emergency contacts.
- Profile audit events are recorded on create and update.
- Profile APIs are owner-scoped and exposed under `/api/v1/profiles/`.
- AI context is exposed through `/api/v1/profiles/ai-context/` with privacy and
  non-diagnostic usage framing.
- Frontend onboarding/profile UI is available at `/profile`.
- Backend tests cover registration, login, nested profile creation, and owner
  scoping.

## Completion Checklist

- [x] User registration and login are planned.
- [x] Health profile fields are complete.
- [x] Profile APIs are specified.
- [x] Onboarding screens are specified.
- [x] Profile validation rules are defined.
- [x] AI context usage is defined.
- [x] Privacy messaging is included.
