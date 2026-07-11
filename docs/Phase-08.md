# Phase 08 - Symptoms Tracker, Health Journal, Diet, and Exercise Planning

## Objectives

- Let users record daily health signals.
- Use symptoms and journal entries to improve timeline, trends, assistant context, and preventive planning.
- Plan personalized diet and exercise recommendations using health profile and report context.

## Features to Build

- Symptoms tracker.
- Daily health journal.
- Mood, stress, sleep, energy, pain, fever, weight, blood pressure, sugar, pulse, and water intake logs.
- Searchable journal.
- Symptom timeline integration.
- AI correlation between symptoms and health data.
- AI diet planner.
- AI exercise planner.
- Dedicated Gemini diet and exercise instance and API key.

## Development Tasks

- Define symptom log model.
- Define journal entry model.
- Define measurement fields and units.
- Design quick daily entry UI.
- Design history and search UI.
- Add timeline events for symptoms and journal entries.
- Define assistant context integration for symptoms and journal notes.
- Define diet planner prompt using profile, reports, allergies, region, religion, budget, food preference, and conditions.
- Define exercise planner prompt using age, weight, known diseases, activity level, and doctor restrictions.
- Add safety rules for diet and exercise advice.
- Define when the system should recommend doctor consultation instead of self-management.

## Dependencies

- Phase 02 health profile.
- Phase 05 timeline and trends.
- Phase 07 AI assistant.
- Gemini diet and exercise API key.

## Expected Deliverables

- Symptom tracker plan.
- Health journal plan.
- Timeline integration plan.
- Diet planner workflow.
- Exercise planner workflow.
- Safety rules for lifestyle guidance.

## Implementation Notes

- Added `daily_health` Django app for symptom logs, journal entries, and lifestyle plans.
- Added owner-scoped APIs under `/api/v1/daily-health/`:
  - `/symptoms/` for symptom tracking.
  - `/journal/` for daily measurement entries and searchable journal history.
  - `/plans/` for diet and exercise plan history/generation.
- Added `SymptomLog` model with severity, pain level, timing, triggers, notes, doctor-consultation flag, and safety notes.
- Added `JournalEntry` model with mood, stress, sleep, energy, pain, fever, weight, blood pressure, sugar, pulse, water intake, notes, and tags.
- Added `LifestylePlan` model with diet/exercise type, recommendations, restrictions, doctor prompts, safety notes, context snapshot, model name, prompt version, and generated timestamp.
- Added timeline events for symptoms and journal entries through the Phase 05 `TimelineEvent` model.
- Updated Health Hub assistant context to include recent symptoms and journal entries.
- Added deterministic mocked diet and exercise planning while preserving the `GEMINI_DIET_EXERCISE_MODEL` boundary.
- Added lifestyle safety rules for severe symptoms, urgent symptom keywords, high pain score, restrictive diets, and major activity changes.
- Added frontend daily health page at `/daily` with symptom entry, quick journal entry, history search, and diet/exercise plan generation.
- Live Gemini diet/exercise calls, richer correlation analysis, notifications, and wearable integrations remain future production work.

## Completion Checklist

- [x] Symptom model is defined.
- [x] Journal model is defined.
- [x] Daily entry UI is specified.
- [x] Search and history are planned.
- [x] Timeline integration is defined.
- [x] Diet planner is specified.
- [x] Exercise planner is specified.
- [x] Lifestyle safety guidance is defined.
