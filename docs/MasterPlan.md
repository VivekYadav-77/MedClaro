# MedClaro Master Project Plan

> Document Type: Master implementation roadmap  
> Project: MedClaro Personal Health Intelligence Platform  
> Frontend: Next.js  
> Backend: Django + Django REST Framework  
> Database: PostgreSQL  
> AI Model: gemini-3.1-flash-lite  
> Local Database: medclaro  
> Local Database Password: shivamyadav

---

## 1. Project Vision

MedClaro is a personal health intelligence platform that helps individuals and families organize, understand, and manage healthcare information across their lifetime. The product is not a diagnostic replacement for doctors. It is a privacy-first, AI-assisted health companion that explains medical information, tracks health changes, prepares users for doctor consultations, and supports family care.

The platform is centered around the Personal Health Profile. Every report, prescription, symptom log, journal entry, family permission, AI conversation, and recommendation should enrich this profile and make future insights more contextual.

---

## 2. Core Product Principles

- Educate, do not diagnose.
- Keep the Personal Health Profile as the foundation for all AI context.
- Treat reports, prescriptions, symptoms, timeline events, and conversations as connected health memory.
- Keep user privacy, consent, and permission controls foundational.
- Support simple, multilingual, accessible explanations for all age groups.
- Design modules independently enough to scale, but connected through shared health intelligence.
- Build doctor-ready summaries that are structured, factual, and clinically useful.
- Maintain clear medical disclaimers and escalation guidance for urgent or high-risk findings.

---

## 3. Target Users

- Individual users managing personal health information.
- Families managing parents, children, spouses, or dependents.
- Senior citizens who need simplified navigation, voice support, and larger UI.
- Chronic disease patients monitoring long-term markers such as blood sugar, blood pressure, thyroid, kidney, liver, and heart-related data.
- Preventive health users who want early awareness and trend monitoring.
- Caregivers and emergency contacts with permission-based access.

---

## 4. High-Level Architecture

### Frontend

Use Next.js for the web application, with responsive layouts for desktop and mobile. The frontend should provide user onboarding, dashboards, document upload flows, report views, prescription views, timeline visualizations, family care screens, doctor export flows, accessibility modes, and AI chat interfaces.

### Backend

Use Django with Django REST Framework as the primary API layer. The backend should manage authentication, users, health profiles, document metadata, analysis records, timeline events, permissions, family groups, reminders, AI conversations, and audit logs.

### Database

Use PostgreSQL as the system of record.

Local development database:

- Database name: `medclaro`
- Password: `shivamyadav`

The database should be designed around durable user-owned health records, structured extracted data, permissions, and AI analysis outputs.

### AI Layer

Use `gemini-3.1-flash-lite` as the required AI model. The system should not use a single shared AI instance for every feature. Instead, define separate Gemini client instances and separate API keys through `.env` for independent modules.

Recommended AI instance separation:

- Report analysis model instance.
- Prescription intelligence model instance.
- Health assistant model instance.
- Trend and risk insight model instance.
- Diet and exercise planning model instance.
- Translation and multilingual response model instance.
- Voice summary text-generation model instance.
- Doctor summary generation model instance.
- Safety and medical guardrail review model instance.

This separation improves scalability, rate-limit management, observability, and failure isolation.

---

## 5. Recommended Environment Variables

The final implementation should use `.env` variables similar to the following naming strategy:

```env
DATABASE_NAME=medclaro
DATABASE_USER=postgres
DATABASE_PASSWORD=shivamyadav
DATABASE_HOST=localhost
DATABASE_PORT=5432

GEMINI_REPORT_ANALYSIS_API_KEY=
GEMINI_PRESCRIPTION_API_KEY=
GEMINI_HEALTH_ASSISTANT_API_KEY=
GEMINI_TRENDS_API_KEY=
GEMINI_DIET_EXERCISE_API_KEY=
GEMINI_TRANSLATION_API_KEY=
GEMINI_DOCTOR_SUMMARY_API_KEY=
GEMINI_SAFETY_REVIEW_API_KEY=

GEMINI_REPORT_ANALYSIS_MODEL=gemini-3.1-flash-lite
GEMINI_PRESCRIPTION_MODEL=gemini-3.1-flash-lite
GEMINI_HEALTH_ASSISTANT_MODEL=gemini-3.1-flash-lite
GEMINI_TRENDS_MODEL=gemini-3.1-flash-lite
GEMINI_DIET_EXERCISE_MODEL=gemini-3.1-flash-lite
GEMINI_TRANSLATION_MODEL=gemini-3.1-flash-lite
GEMINI_DOCTOR_SUMMARY_MODEL=gemini-3.1-flash-lite
GEMINI_SAFETY_REVIEW_MODEL=gemini-3.1-flash-lite
```

Exact variable names may be refined during implementation, but the planning assumption is that each major AI module can be configured, monitored, rotated, and rate-limited independently.

---

## 6. Major Product Modules

### Personal Health Profile

Captures age, gender, height, weight, blood group, occupation, smoking, alcohol, exercise, sleep, known diseases, allergies, family history, pregnancy status when applicable, emergency contact, preferred language, food preference, location, and other longitudinal context.

### AI Health Report Analysis

Analyzes uploaded lab reports and produces health score, health status, key findings, biomarker explanations, normal ranges, causes, food guidance, doctor discussion prompts, and multi-level explanations from simple to doctor mode.

### Health Timeline

Transforms reports, prescriptions, symptoms, journal entries, medication changes, and important events into a time-based health journey.

### Health Trends

Compares repeated biomarkers and health events across multiple reports to identify improving, worsening, stable, or fluctuating trends.

### Health Risk Awareness

Provides non-diagnostic risk awareness based on profile, family history, lifestyle, symptoms, and trends. Outputs should always be framed as discussion points for qualified clinicians.

### Medication Intelligence

Explains medications, detects duplicate medicines, flags allergy concerns, surfaces possible interactions, identifies old prescriptions, and supports reminders.

### Central Health Hub

Acts as the main dashboard showing health score, recent analyses, trend alerts, medicine reminders, family updates, AI suggestions, and upcoming health actions.

### AI Health Assistant

Provides contextual educational answers based on the user's reports, prescriptions, allergies, symptoms, timeline, and past conversations.

### Symptoms Tracker and Health Journal

Allows users to log pain, fever, mood, stress, sleep, energy, weight, blood pressure, sugar, pulse, water intake, food notes, exercise, and daily observations.

### Family Care Circle

Supports family groups with roles such as owner, parent, child, doctor, caregiver, and emergency contact. Access must be permission-based.

### Emergency Mode

Provides one-click emergency access to blood group, allergies, current medicines, known diseases, emergency contacts, insurance details, doctor contacts, and QR-based summary access.

### Doctor Mode

Generates concise clinical summaries including history, current medicines, major trends, risk factors, recent reports, and questions to discuss.

### Accessibility, Voice, and Language

Supports senior citizen mode, voice-first experiences, text-to-speech summaries, larger UI, simple navigation, and multiple Indian languages.

### Future Expansion

Includes diet planning, exercise planning, vaccination tracking, women's health, child growth tracking, insurance folder, medical vault, second opinion support, health education, wearable integrations, pharmacy integration, hospital connectivity, and appointment management.

---

## 7. Development Strategy

Build MedClaro in layered phases:

1. Establish secure product foundations and project architecture.
2. Build identity, onboarding, and Personal Health Profile.
3. Add secure medical document storage and upload workflows.
4. Build AI report analysis and structured biomarker storage.
5. Add report history, comparisons, timeline, and trend intelligence.
6. Build prescription intelligence and medication management.
7. Build the Central Health Hub.
8. Add contextual AI Health Assistant memory.
9. Add symptoms tracker, health journal, and risk awareness.
10. Add Family Care Circle and permission-based sharing.
11. Add doctor summaries and emergency mode.
12. Add accessibility, multilingual, and voice-first experiences.
13. Add preventive planning modules and advanced future-ready capabilities.
14. Harden security, observability, testing, deployment, and compliance readiness.

This order keeps the foundational health profile and data model stable before adding more intelligent features.

---

## 8. Milestone Roadmap

### Milestone 1: Foundation Ready

- Django, DRF, Next.js, and PostgreSQL architecture planned.
- Authentication and user model planned.
- Environment strategy planned.
- AI client separation planned.
- Security and audit requirements documented.

### Milestone 2: User Health Profile Ready

- Registration and profile onboarding planned.
- Health profile fields defined.
- User preference and language model planned.
- Profile completion and update flows specified.

### Milestone 3: Document Intelligence Ready

- Report and prescription upload workflows planned.
- Document metadata and storage model planned.
- AI report analysis workflow specified.
- Structured biomarkers and analysis outputs specified.

### Milestone 4: Longitudinal Health Intelligence Ready

- Report history planned.
- Timeline event architecture planned.
- Trend comparison logic planned.
- Risk awareness framing planned.

### Milestone 5: Medication and Prescription Intelligence Ready

- Prescription analysis planned.
- Medication records planned.
- Interaction, allergy, duplication, and reminder planning completed.

### Milestone 6: Health Hub and Assistant Ready

- Dashboard data aggregation planned.
- Contextual assistant memory planned.
- AI conversation safety requirements planned.

### Milestone 7: Family, Doctor, Emergency, and Accessibility Ready

- Family Care Circle roles and permissions planned.
- Doctor summary export planned.
- Emergency profile planned.
- Voice, multilingual, and senior mode planning completed.

### Milestone 8: Production Readiness

- Testing strategy completed.
- Observability and audit plans completed.
- Deployment plan completed.
- Security hardening and release checklist completed.

---

## 9. Cross-Module Dependencies

- AI analysis depends on Health Profile context.
- Health Timeline depends on reports, prescriptions, symptoms, journal entries, and medication events.
- Health Trends depend on structured biomarker extraction and historical reports.
- Health Risk Awareness depends on profile, trends, symptoms, lifestyle, and family history.
- Health Hub depends on reports, prescriptions, trends, reminders, family updates, and AI recommendations.
- AI Health Assistant depends on profile memory, report summaries, prescriptions, symptoms, allergies, and conversations.
- Family Care Circle depends on strong permission and audit systems.
- Doctor Mode depends on clean structured data across all health modules.
- Emergency Mode depends on verified profile, medication, allergy, condition, and contact data.
- Multilingual and voice experiences depend on stable text summaries and user language preferences.

---

## 10. Data Architecture Themes

Core entities should include:

- User account.
- User profile.
- Personal health profile.
- Allergy.
- Known disease or condition.
- Family history item.
- Emergency contact.
- Medical document.
- Report analysis.
- Biomarker result.
- Prescription analysis.
- Medication.
- Medication reminder.
- Symptom log.
- Health journal entry.
- Timeline event.
- Trend insight.
- Risk awareness insight.
- AI conversation.
- AI message.
- Family care circle.
- Family role.
- Permission grant.
- Doctor summary.
- Emergency profile.
- Audit log.

Data design should support both structured clinical-like records and AI-generated explanatory content.

---

## 11. AI Safety Strategy

All AI outputs should follow these rules:

- Avoid diagnosis claims.
- Avoid replacing doctor consultation.
- Use educational and explanatory language.
- Clearly distinguish extracted facts from AI interpretation.
- Ask users to consult qualified doctors for concerning findings.
- Escalate urgent symptoms or critical markers with clear medical-care guidance.
- Use safety review for high-risk outputs.
- Keep prompts module-specific and context-bounded.
- Store AI output metadata, model name, prompt version, and analysis timestamp.
- Allow future prompt versioning and re-analysis.

---

## 12. Security and Privacy Strategy

MedClaro handles sensitive health information, so the implementation must include:

- Secure authentication.
- Permission-based access to shared family data.
- Encrypted secrets through environment configuration.
- Secure document storage rules.
- Audit logs for sensitive access.
- User ownership of health records.
- Explicit consent for sharing.
- Minimal data exposure in APIs.
- Role-based access checks.
- Safe deletion and export planning.
- Clear privacy and medical disclaimers.

---

## 13. Testing Strategy

Testing should include:

- Backend unit tests for models, serializers, permissions, and services.
- API tests for authentication, profile, upload, analysis, family sharing, and exports.
- Frontend tests for critical user flows.
- AI service tests using mocked Gemini responses.
- Permission tests for family access boundaries.
- Security tests for unauthorized data access.
- Regression tests for timeline, trends, and dashboard aggregation.
- Manual QA for elderly mode, multilingual output, and mobile layouts.

---

## 14. Documentation Index

Recommended phase documents:

- `Phase-01.md`: Foundation, architecture, and environment planning.
- `Phase-02.md`: Identity, onboarding, and Personal Health Profile.
- `Phase-03.md`: Medical document upload and storage.
- `Phase-04.md`: AI health report analysis.
- `Phase-05.md`: Report history, timeline, trends, and risk awareness.
- `Phase-06.md`: Prescription and medication intelligence.
- `Phase-07.md`: Central Health Hub and contextual AI assistant.
- `Phase-08.md`: Symptoms tracker, health journal, diet, and exercise planning.
- `Phase-09.md`: Family Care Circle, doctor mode, and emergency mode.
- `Phase-10.md`: Accessibility, multilingual, voice, and senior citizen mode.
- `Phase-11.md`: Future modules and ecosystem expansion.
- `Phase-12.md`: Testing, security hardening, deployment, and release readiness.

---

## 15. Definition of Project Completion

The project can be considered complete for the first major release when:

- Users can create accounts and complete health profiles.
- Users can upload and analyze reports and prescriptions.
- AI outputs are contextual, safe, and linked to the user's health profile.
- Structured biomarkers and medications are stored for future comparison.
- Users can view history, timeline, trends, and health hub summaries.
- Users can use the AI Health Assistant with health memory.
- Users can manage family sharing with permissions.
- Users can generate doctor-ready summaries.
- Emergency profile access is available.
- Senior-friendly, multilingual, and voice-supported experiences are planned or implemented according to release scope.
- Security, privacy, tests, and deployment readiness are completed.
