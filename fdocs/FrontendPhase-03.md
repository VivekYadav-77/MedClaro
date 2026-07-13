# Frontend Phase 03 - Authentication, Onboarding, And Health Profile

## Objective

Turn registration, login, and Personal Health Profile creation into a guided production onboarding experience. The profile is MedClaro's foundation, so this phase has high priority.

## User Goals

- Create an account.
- Understand why profile data matters.
- Complete essential health context without feeling overwhelmed.
- Add allergies, known conditions, family history, emergency contacts, language, and consent.
- Reach the Health Hub with clear next actions.

## Key Screens

- Register.
- Sign in.
- Profile onboarding wizard.
- Profile detail/edit page.
- Profile completion dashboard card.
- Consent and privacy summary.

## Onboarding Flow

1. Account creation.
2. Safety and privacy introduction.
3. Basic details: age, gender, height, weight, blood group, occupation.
4. Lifestyle: smoking, alcohol, exercise, sleep, food preference, location.
5. Medical context: allergies, known conditions, family history.
6. Emergency contacts.
7. Language and accessibility preferences.
8. Consent and review.
9. Health Hub handoff.

## Layout Strategy

Desktop:

- Wizard form on the left.
- Context panel on the right showing why each section helps AI personalization.
- Completion meter and save status visible.

Mobile:

- One section per step.
- Sticky "Continue" action.
- Save progress clearly shown.

Senior Mode:

- Fewer fields per step.
- Larger inputs.
- Voice/read-aloud option for privacy and consent language.
- One-click emergency contact entry assistance.

## Component Needs

- `AuthForm`
- `OnboardingStepper`
- `ProfileCompletionCard`
- `NestedListEditor` for allergies, conditions, family history, and contacts.
- `ConsentPanel`
- `LanguageSelector`
- `SeniorModePrompt`
- `SaveStatusIndicator`

## Content Strategy

Use simple, supportive language:

- "This helps MedClaro personalize explanations."
- "You can update this later."
- "MedClaro does not diagnose or replace a doctor."
- "Only people you authorize can access shared health information."

Avoid intimidating users with long medical descriptions during onboarding.

## Validation And Safety

- Validate numeric ranges before submit.
- Explain required vs optional.
- Do not force sensitive fields such as pregnancy status or smoking/alcohol beyond "prefer not to say".
- Confirm privacy consent before AI context is used.
- Show clear recovery for duplicate profile or failed save.

## Dependencies

- Accounts API.
- Profiles API.
- Accessibility preferences API for language and senior mode defaults.

## Completion Checklist

- [x] Register/sign-in flow planned without raw token copy/paste.
- [x] Profile onboarding wizard sections defined.
- [x] Nested health context editing planned.
- [x] Consent and privacy UX defined.
- [x] Mobile and Senior Mode onboarding defined.
- [x] Health Hub handoff after onboarding defined.

## Implementation Notes

Phase 03 has been implemented in the frontend codebase:

- `/register` now collects first name, last name, username, email, password, and password confirmation, then signs the user in and sends them to `/profile`.
- `/signin` uses session-based access language and directs returning users into the Health Hub.
- `/profile` is now a guided onboarding wizard with steps for safety/privacy, basic details, lifestyle, medical context, emergency contacts, language/preferences, consent/review, and Health Hub handoff.
- The profile wizard loads the current user profile, creates it if missing, updates it when it already exists, and handles duplicate-profile recovery.
- Nested editors are included for allergies, known conditions, family history, and emergency contacts.
- Client-side validation covers numeric ranges and requires privacy consent before saving AI profile context.
- The wizard includes profile completion, contextual help, Senior Mode setup messaging, and Health Hub handoff.
- `frontend/lib/api.ts` now includes current-profile and update helpers.

Verified with `npm.cmd run build`.
