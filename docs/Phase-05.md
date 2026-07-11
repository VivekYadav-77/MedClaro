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

## Implementation Notes

- Added `health_trends` Django app for report history, timeline events, and biomarker trend insights.
- Added owner-scoped APIs under `/api/v1/health-trends/`:
  - `/reports/` for report history summaries.
  - `/timeline/` for timeline events with year, event type, and biomarker filters.
  - `/biomarkers/` for graph-ready biomarker trend payloads.
  - `/insights/` for refreshing and reading persisted trend insights.
- Added `TimelineEvent` model for reports now and future prescriptions, symptoms, medicines, doctor summaries, and journal entries.
- Added `TrendInsight` model with graph points, trend label, report count, first/latest value, delta, risk awareness, doctor prompts, model name, and prompt version.
- Implemented deterministic trend comparison over stored Phase 04 biomarkers.
- Implemented trend labels:
  - `improving`
  - `worsening`
  - `stable`
  - `fluctuating`
  - `insufficient_data`
- Preserved the dedicated Gemini trends boundary through `GEMINI_TRENDS_MODEL`.
- Added non-diagnostic risk-awareness wording for all generated trend states.
- Added frontend trends page at `/trends` with timeline filters, report/trend counts, selectable biomarker trend cards, graph rendering, risk awareness, and doctor prompts.
- Phase 06 prescription events can plug into `TimelineEvent` through `event_type`, `source_type`, `source_id`, and `metadata`.

## Completion Checklist

- [x] Report history is specified.
- [x] Timeline event structure is defined.
- [x] Trend graph data structure is defined.
- [x] Trend AI instance is planned.
- [x] Risk awareness safety rules are defined.
- [x] Frontend trend views are specified.
- [x] Doctor discussion prompts are included.
