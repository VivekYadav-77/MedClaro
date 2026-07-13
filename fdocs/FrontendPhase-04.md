# Frontend Phase 04 - Medical Vault, Reports, And Timeline Intelligence

## Objective

Create production workflows for document upload, report analysis, biomarker explanation, report history, timeline, and trends.

## Modules Covered

- Medical Vault.
- AI Report Analysis.
- Report History.
- Health Timeline.
- Health Trends.

## Medical Vault Strategy

The Vault should feel like a secure personal health archive.

Primary workflow:

1. Upload document.
2. Confirm document type.
3. Add source date and description.
4. Show upload progress.
5. Show processing status.
6. Offer next action: analyze report, analyze prescription, preview, download, or edit metadata.

Vault layout:

- Left/top: upload dropzone and quick filters.
- Main: document list/table with status, type, date, size, and next action.
- Detail drawer: metadata, preview, status, download, delete.

## Report Insights Strategy

Report analysis should prioritize comprehension:

- Health score and status.
- Key findings sorted by severity.
- Safety review if applicable.
- Biomarker list with current value, normal range, severity, trend, and explanation.
- Explanation levels: Grandma, Simple, Detailed, Medical Student, Doctor Mode.
- Food and lifestyle guidance.
- Doctor prompts.
- Source and generated metadata.

The biomarker UI should be expandable, searchable, and filterable by abnormal, critical, category, or trend.

## Timeline & Trends Strategy

Timeline:

- Group events by year and month.
- Include reports, prescriptions, symptoms, journals, medicines, doctor summaries, emergency shares, and future module events.
- Use event icons and tags.
- Support filters by year, event type, biomarker, document type, and severity.

Trends:

- Biomarker trend cards.
- Detail chart with accessible data table.
- Explanation of label: improving, worsening, stable, fluctuating, insufficient data.
- Non-diagnostic risk-awareness copy.
- Doctor discussion prompts.

## Component Needs

- `UploadDropzone`
- `DocumentTypeSelector`
- `DocumentStatusBadge`
- `DocumentRow`
- `DocumentDetailDrawer`
- `ReportSummaryHeader`
- `HealthScoreGauge`
- `KeyFindingsList`
- `BiomarkerAccordion`
- `ExplanationLevelSwitcher`
- `TrendChart`
- `TrendDataTable`
- `TimelineEvent`
- `TimelineFilterBar`

## Responsive Behavior

Mobile:

- Upload flow as full-screen stepper.
- Document details in bottom sheet.
- Biomarker accordions as full-width rows.
- Trend chart followed by table.

Desktop:

- Split list/detail views.
- Persistent filters.
- Side-by-side summary and biomarker panels.

## Accessibility

- Upload control must support keyboard and file input fallback.
- Charts require text summaries and table alternatives.
- Abnormal and critical statuses require text labels and icons.
- Expand/collapse controls require `aria-expanded`.

## Dependencies

- Documents API.
- Report analysis API.
- Health trends API.
- Profile context for personalization.

## Completion Checklist

- [ ] Vault upload and document history workflow specified.
- [ ] Document status and next-action strategy defined.
- [ ] Report analysis hierarchy defined.
- [ ] Biomarker explanation component strategy defined.
- [ ] Timeline grouping and filters defined.
- [ ] Trend chart accessibility requirements defined.

