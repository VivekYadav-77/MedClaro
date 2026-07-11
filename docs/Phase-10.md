# Phase 10 - Accessibility, Multilingual, Voice, and Senior Citizen Mode

## Objectives

- Make MedClaro accessible for senior citizens, visually impaired users, and users who prefer Indian languages.
- Add voice-first and simplified interaction patterns.
- Ensure medical explanations are understandable at different literacy levels.

## Features to Build

- Preferred language experience.
- Multi-language AI responses.
- Dedicated Gemini translation and multilingual instance and API key.
- Voice summaries.
- Report read-aloud experience.
- Assistant voice interaction planning.
- Senior Citizen Mode.
- Large fonts.
- Simplified navigation.
- One-click important actions.
- Reduced-complexity dashboard.

## Development Tasks

- Define supported language roadmap.
- Define translation and localization strategy.
- Define how AI outputs are generated or translated per language.
- Define text-to-speech integration points.
- Define speech-to-text integration points when voice input is added.
- Design senior mode interface rules.
- Design accessibility preferences model.
- Ensure dashboard, report analysis, prescriptions, and assistant support simplified views.
- Define quality checks for translated medical explanations.
- Define fallback language behavior.

## Dependencies

- Phase 02 preferred language profile field.
- Phase 04 report explanation output.
- Phase 06 prescription output.
- Phase 07 AI assistant.
- Gemini translation API key.
- Voice provider decision.

## Expected Deliverables

- Multilingual strategy.
- Voice experience plan.
- Senior Citizen Mode plan.
- Accessibility preferences plan.
- Simplified UI requirements.

## Implementation Notes

- Added `accessibility` Django app for accessibility preferences, localized content artifacts, and voice summary planning.
- Added owner-scoped APIs under `/api/v1/accessibility/`:
  - `/preferences/` for preferred language, fallback language, senior mode, text size, high contrast, reduced motion, voice summaries, read-aloud reports, voice input planning, and one-click actions.
  - `/plan/` for supported language roadmap, translation workflow, quality checks, voice workflow, senior mode rules, and fallback behavior.
  - `/simplified-dashboard/` for reduced-complexity dashboard cards and one-click actions.
  - `/localized-content/` for mocked multilingual artifacts with quality checks.
  - `/voice-summaries/` for read-aloud and voice summary planning artifacts.
- Added supported language roadmap:
  - English
  - Hindi
  - Bengali
  - Tamil
  - Telugu
  - Marathi
  - Gujarati
  - Kannada
  - Malayalam
  - Punjabi
  - Urdu
- Preserved the dedicated Gemini translation boundary through `GEMINI_TRANSLATION_MODEL`.
- Added fallback language behavior using English as default fallback when translation confidence or support is insufficient.
- Added translation quality checks for preserving numbers, units, medicine names, biomarker names, and warning severity.
- Added senior mode rules for large text, simplified dashboard, one-click actions, reduced motion, and high contrast.
- Added voice experience planning for report read-aloud, assistant responses, doctor summaries, emergency profiles, text-to-speech provider selection, and future speech-to-text.
- Added frontend Accessibility page at `/accessibility` with preferences, language roadmap, simplified dashboard preview, translation drafts, and voice summary planning.
- Live translation, live text-to-speech, live speech-to-text, real audio generation, and human medical translation review remain future production integrations.

## Completion Checklist

- [x] Supported language roadmap is defined.
- [x] Translation workflow is specified.
- [x] Dedicated multilingual Gemini instance is planned.
- [x] Voice summary flow is specified.
- [x] Senior mode UI rules are defined.
- [x] Accessibility preferences are defined.
- [x] Fallback language behavior is defined.
