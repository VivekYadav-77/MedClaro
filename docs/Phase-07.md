# Phase 07 - Central Health Hub and Contextual AI Assistant

## Objectives

- Build the Central Health Hub as the user's primary dashboard.
- Build an AI Health Assistant that uses health memory instead of acting like a generic chatbot.
- Aggregate health profile, reports, prescriptions, symptoms, trends, reminders, and family updates into one intelligent experience.

## Features to Build

- Central Health Hub homepage.
- Health score card.
- Recent report and prescription summaries.
- Trend alerts.
- Upcoming medicine reminders.
- AI suggestions.
- Family updates.
- Contextual AI assistant.
- Conversation history.
- AI memory context assembly.
- Safety-reviewed AI answers.

## Development Tasks

- Define dashboard aggregation API.
- Define health hub widgets.
- Define ranking rules for alerts and suggestions.
- Define dedicated Gemini health assistant instance and API key.
- Define assistant context builder:
  - Profile.
  - Allergies.
  - Known diseases.
  - Recent reports.
  - Biomarker trends.
  - Current medicines.
  - Prescription warnings.
  - Symptoms and journal entries.
  - Family context when permission allows.
- Define AI conversation model.
- Define message storage and retrieval rules.
- Define response safety rules.
- Design frontend chat interface.
- Design empty, loading, error, and sensitive-answer states.

## Dependencies

- Phase 02 health profile.
- Phase 04 report analysis.
- Phase 05 trends.
- Phase 06 medications.
- Family updates from Phase 09 when available.
- Gemini health assistant API key.

## Expected Deliverables

- Health Hub dashboard plan.
- AI assistant context strategy.
- Conversation storage plan.
- Assistant safety plan.
- Frontend dashboard and chat plans.

## Implementation Notes

- Added `health_hub` Django app for dashboard aggregation, assistant context assembly, and conversation storage.
- Added owner-scoped APIs under `/api/v1/health-hub/`:
  - `/dashboard/` for profile readiness, health score, recent reports, recent prescriptions, alerts, suggestions, reminders, timeline, and family-update placeholders.
  - `/memory-context/` for assistant context assembled from profile, allergies, known conditions, family history, recent reports, biomarker trends, medicines, prescription warnings, and future symptom/family placeholders.
  - `/assistant/conversations/` for conversation history.
  - `/assistant/conversations/<id>/` for message retrieval.
  - `/assistant/turns/` for user message submission and mocked assistant response.
- Added `AssistantConversation` model with context snapshot, model name, prompt version, safety review metadata, and timestamps.
- Added `AssistantMessage` model with role, content, safety flags, cited context, and timestamp.
- Preserved the dedicated Gemini health assistant boundary through `GEMINI_HEALTH_ASSISTANT_MODEL`.
- Added deterministic assistant replies that cite available MedClaro context counts and avoid diagnosis language.
- Added sensitive-answer safety flags for urgent, diagnostic, overdose, allergic reaction, breathing, and self-harm related terms.
- Added ranked dashboard alert rules using prescription warning severity and worsening/fluctuating trend labels.
- Added AI suggestion rules for missing profile, recent reports, prescription warnings, and alert summaries.
- Added frontend Health Hub page at `/hub` with widgets, ranked alerts, suggestions, reminders, timeline, assistant chat, empty/error/loading states, and sensitive-answer state.
- Dashboard root now prioritizes the Health Hub link.
- Live Gemini health assistant calls and Phase 08/09 symptoms, journal, and family context are future integrations.

## Completion Checklist

- [x] Health Hub widgets are defined.
- [x] Dashboard aggregation API is specified.
- [x] Dedicated health assistant Gemini instance is planned.
- [x] Assistant context builder is defined.
- [x] Conversation model is defined.
- [x] Safety rules are defined.
- [x] Frontend assistant experience is planned.
