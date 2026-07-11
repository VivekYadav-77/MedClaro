# Phase 06 - Prescription and Medication Intelligence

## Objectives

- Analyze prescriptions and medication lists.
- Help users understand medicines, timing, precautions, interactions, and safety considerations.
- Connect prescriptions and medicines to the user's health profile, allergies, and timeline.

## Features to Build

- Prescription upload analysis.
- Dedicated Gemini prescription intelligence instance and API key.
- Medicine explanation.
- Purpose and usage guidance.
- Side effect explanation.
- Food interaction warnings.
- Alcohol and driving warnings.
- Allergy awareness.
- Medicine interaction awareness.
- Duplicate medicine detection.
- Expired prescription warning.
- Pregnancy and breastfeeding safety notes.
- Medication reminders.
- Prescription history.

## Development Tasks

- Define prescription analysis prompt strategy.
- Define prescription analysis data model.
- Define medication data model.
- Define medicine schedule and reminder model.
- Define interaction severity categories.
- Define duplicate detection approach by active ingredient and brand names.
- Define allergy cross-check flow.
- Define expired prescription logic.
- Design prescription result UI.
- Design medication list UI.
- Design reminder UI and notification planning.
- Add timeline events for prescriptions and medication changes.
- Store model name, prompt version, timestamp, and source document reference.

## Dependencies

- Phase 02 health profile and allergies.
- Phase 03 document upload.
- Phase 05 timeline integration.
- Gemini prescription API key.
- Safety review flow for high-risk warnings.

## Expected Deliverables

- Prescription analysis workflow plan.
- Medication model plan.
- Interaction and allergy warning plan.
- Reminder planning.
- Prescription history and UI plan.

## Implementation Notes

- Added `medication_intelligence` Django app for prescription analysis, medication records, schedules, reminders, and warnings.
- Added owner-scoped APIs under `/api/v1/prescriptions/`:
  - `/analyses/` for prescription analysis request, history, details, and status.
  - `/medications/` for extracted owner-scoped medication list.
- Added `PrescriptionAnalysis` model with source document reference, prescribed/expiry dates, expiry flag, warnings, safety review metadata, model name, prompt version, payload, and timestamps.
- Added `Medication` model with brand name, active ingredient, strength, purpose, usage guidance, side effects, food warnings, alcohol warning, driving warning, pregnancy/breastfeeding note, and duplicate key.
- Added `MedicationSchedule` model with dosage, frequency, timing, start/end dates, reminder status, notification planning metadata, and instructions.
- Added `MedicationWarning` model with warning type and severity categories:
  - `info`
  - `low`
  - `moderate`
  - `high`
  - `critical`
- Implemented deterministic mocked prescription analysis while preserving the dedicated Gemini prescription boundary through `GEMINI_PRESCRIPTION_MODEL`.
- Implemented duplicate detection by normalized active ingredient.
- Implemented allergy cross-check against Phase 02 profile allergies.
- Implemented interaction, alcohol, driving, food, expired prescription, and pregnancy/breastfeeding safety prompts.
- Added prescription timeline events through the Phase 05 `TimelineEvent` model.
- Added frontend prescription page at `/prescriptions` with analysis trigger, prescription history, medication cards, schedules, reminder planning, and safety warnings.
- Actual OCR/live Gemini prescription extraction, medication database integration, and notification delivery remain future production integrations.

## Completion Checklist

- [x] Dedicated prescription Gemini instance is planned.
- [x] Prescription analysis schema is defined.
- [x] Medication model is defined.
- [x] Interaction checks are planned.
- [x] Allergy checks are planned.
- [x] Reminder workflow is specified.
- [x] Timeline integration is specified.
- [x] Prescription result UI is planned.
