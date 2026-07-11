# Phase 04 - AI Health Report Analysis

## Objectives

- Analyze laboratory reports with `gemini-3.1-flash-lite`.
- Convert medical reports into structured, understandable health intelligence.
- Store extracted biomarkers for history, trends, and doctor summaries.

## Features to Build

- AI report analysis pipeline.
- Dedicated Gemini report analysis instance and API key.
- Health score generation.
- Health status classification.
- Key findings summary.
- Biomarker extraction.
- Normal range comparison.
- Expandable biomarker explanation.
- Five explanation levels:
  - Explain to Grandma.
  - Simple.
  - Detailed.
  - Medical Student.
  - Doctor Mode.
- Food and lifestyle guidance.
- Doctor consultation prompts.
- Safety-reviewed AI output.

## Development Tasks

- Define report analysis prompt strategy.
- Define structured AI output schema.
- Define biomarker result model.
- Define report analysis model.
- Define health score calculation boundaries.
- Define status categories:
  - Good.
  - Needs Attention.
  - Critical.
- Define abnormal marker explanation rules.
- Define doctor-needed guidance wording.
- Add AI safety review step for critical or high-risk results.
- Store model name, prompt version, timestamp, and source document reference.
- Design frontend report analysis result page.
- Design expandable biomarker cards and graph placeholders.

## Dependencies

- Phase 02 Personal Health Profile.
- Phase 03 document upload.
- Gemini report analysis API key.
- AI safety baseline.

## Expected Deliverables

- Report analysis workflow plan.
- Structured biomarker storage plan.
- AI prompt and response schema plan.
- Report analysis result UI plan.
- Safety review workflow plan.

## Completion Checklist

- [ ] Dedicated report analysis Gemini instance is planned.
- [ ] Report analysis schema is defined.
- [ ] Biomarker model is defined.
- [ ] Health score rules are defined.
- [ ] Health status rules are defined.
- [ ] Explanation levels are defined.
- [ ] Safety review flow is defined.
- [ ] Frontend result view is specified.
