# Frontend Phase 05 - Medicines, Daily Health, And Health Hub

## Objective

Upgrade the most frequently used health management surfaces: Health Hub, Prescription Intelligence, active medicines, symptom logging, journal, and lifestyle planning.

## Health Hub Strategy

The Health Hub becomes the authenticated home. It should answer:

- What needs my attention today?
- What changed recently?
- What should I do next?
- What is MedClaro remembering about my health?
- What can I ask the assistant?

Desktop layout:

- Top status band: greeting, health score, profile completion, top alert.
- Main column: ranked alerts, next actions, recent timeline.
- Right rail: assistant, reminders, family updates.
- Lower section: trend snapshot, latest report, latest prescription.

Mobile layout:

- Top alert.
- Today actions.
- Health score/profile completion.
- Assistant button.
- Reminders, timeline, and suggestions.

## Prescription And Medicine Strategy

Separate the module into:

- Prescription analyses.
- Active medicines.
- Safety warnings.
- Reminder schedules.
- Food/alcohol/driving/pregnancy notes.

Warnings should be ranked by severity:

- Critical and high: prominent safety panel.
- Moderate: visible warning row.
- Low/info: expandable details.

## Daily Health Strategy

Daily Health should be fast and gentle:

- Quick check-in: symptom, pain level, mood, stress, sleep, energy.
- Journal: title, notes, tags.
- History: searchable symptoms and journal entries.
- Lifestyle planning: diet and exercise tabs with restrictions and doctor prompts.

Avoid long daily forms. Use compact inputs, sliders, segmented controls, and quick-add chips.

## Assistant Strategy

The assistant should not feel like a generic chatbot. It should show:

- Context snapshot used.
- Cited modules: reports, medicines, trends, symptoms.
- Safety flags when applicable.
- Suggested follow-up questions.
- Strong urgent-care guidance for sensitive topics.

## Component Needs

- `HubStatusBand`
- `RankedAlertList`
- `TodayActionList`
- `ReminderList`
- `AssistantThread`
- `ContextSnapshot`
- `MedicationCard`
- `MedicationWarningPanel`
- `ReminderScheduleEditor`
- `DailyCheckInForm`
- `JournalEntryList`
- `LifestylePlanPanel`

## Interaction Rules

- Assistant send button disabled for empty text.
- Severe symptoms trigger visible care guidance.
- Medication warnings should not be dismissible without preserving history.
- Lifestyle plans must show restrictions and doctor prompts, not only recommendations.

## Dependencies

- Health Hub API.
- Prescription and medication APIs.
- Daily health APIs.
- Health trends and report analysis data.
- Profile and accessibility preferences.

## Completion Checklist

- [x] Health Hub production layout defined.
- [x] Assistant context and safety display defined.
- [x] Prescription and active medicine information architecture defined.
- [x] Daily check-in and journal workflows defined.
- [x] Lifestyle plan display rules defined.
- [x] Mobile-first frequent-use behavior defined.
