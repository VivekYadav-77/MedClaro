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

## Completion Checklist

- [ ] Health Hub widgets are defined.
- [ ] Dashboard aggregation API is specified.
- [ ] Dedicated health assistant Gemini instance is planned.
- [ ] Assistant context builder is defined.
- [ ] Conversation model is defined.
- [ ] Safety rules are defined.
- [ ] Frontend assistant experience is planned.
