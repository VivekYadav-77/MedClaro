# Phase 05 - Report History, Timeline, Trends, and Risk Awareness

## Objectives

- Move from isolated report analysis to long-term health intelligence.
- Build history, comparison, timeline, and non-diagnostic risk awareness.
- Help users understand their health journey over time.

## Features to Build

- Report history.
- Report comparison.
- Biomarker trend graphs.
- Health Timeline.
- Trend insights across 5, 10, and 20 reports.
- Health improvement and decline detection.
- Non-diagnostic risk awareness.
- Timeline events for reports, prescriptions, symptoms, medicines, doctor summaries, and journal entries.

## Development Tasks

- Define report history API and UI.
- Define timeline event model.
- Define trend insight model.
- Define biomarker comparison logic.
- Plan graph data format for frontend.
- Design trend labels:
  - Improving.
  - Worsening.
  - Stable.
  - Fluctuating.
  - Insufficient Data.
- Define AI trend analysis prompt using dedicated Gemini trends instance.
- Define risk awareness prompt rules using profile, family history, lifestyle, and trends.
- Ensure all risk outputs avoid diagnosis language.
- Design timeline filters by year, biomarker, report type, medicine, and condition.
- Define doctor discussion prompts for concerning trends.

## Dependencies

- Phase 04 biomarker extraction.
- Phase 02 health profile.
- Phase 06 prescription timeline integration when available.
- Gemini trends API key.

## Expected Deliverables

- Report history plan.
- Timeline architecture.
- Trend insight workflow.
- Risk awareness workflow.
- Frontend timeline and trend view plans.

## Completion Checklist

- [ ] Report history is specified.
- [ ] Timeline event structure is defined.
- [ ] Trend graph data structure is defined.
- [ ] Trend AI instance is planned.
- [ ] Risk awareness safety rules are defined.
- [ ] Frontend trend views are specified.
- [ ] Doctor discussion prompts are included.
