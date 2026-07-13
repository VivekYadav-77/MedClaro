# MedClaro Frontend Master Plan

> Document type: Production frontend redesign roadmap  
> Scope: Next.js App Router frontend only  
> Project state reviewed: Phase 12 complete backend and prototype frontend  
> Goal: Upgrade MedClaro from prototype screens into a trustworthy, scalable, accessible, production-quality health intelligence interface

---

## 1. Product Understanding

MedClaro is a personal health intelligence platform, not a single report analyzer. The frontend must make that ecosystem clear. Every screen should reinforce that the Personal Health Profile is the user's health memory, the Medical Vault is the source of truth for documents, the Health Hub is the daily command center, and AI features exist to explain, organize, and prepare users for qualified care.

The current frontend proves the backend APIs work, but it is still a testing interface. Most pages use local token fields, repeated one-off layouts, sparse empty states, and technical workflow language. The production redesign should convert those pages into a coherent health product with a persistent app shell, guided onboarding, safe AI language, role-aware sharing, accessible defaults, and module-specific views that can scale as more data and AI integrations arrive.

## 2. Core Frontend Principles

- Health memory first: route users toward completing the profile, uploading documents, and building timeline continuity.
- Explain, do not diagnose: every AI insight should distinguish facts, interpretation, uncertainty, and doctor discussion prompts.
- Calm operational UI: dashboards and feature pages should feel focused, scannable, and trustworthy instead of decorative.
- Progressive disclosure: show the essential summary first, then deeper biomarker, medication, timeline, and safety details on demand.
- Permission visibility: family, doctor, emergency, and partner sharing must always show who can access what and for how long.
- Senior-friendly by default: touch targets, contrast, readable copy, voice/read-aloud affordances, and simplified views should not be bolted on later.
- Multilingual resilience: preserve medical terms, numbers, ranges, severity labels, and English fallback behavior.
- Prototype escape hatch removal: users should never paste raw API tokens into production feature screens.

## 3. Existing Frontend Inventory

Current routes:

- `/`: prototype landing/dashboard with links to every module.
- `/profile`: Personal Health Profile form and completion meter.
- `/documents`: Medical Vault upload and document history.
- `/reports`: report analysis request, history, health score, findings, biomarkers, explanation levels.
- `/trends`: report history, timeline, biomarker trend cards, basic SVG trend graph.
- `/prescriptions`: prescription analysis, medications, warnings, reminders, safety prompts.
- `/hub`: Health Hub dashboard and contextual assistant.
- `/daily`: symptom tracker, journal, lifestyle plan generation.
- `/family`: care circles, invitations, Doctor Mode, Emergency Mode.
- `/accessibility`: language, senior mode, simplified dashboard, localization, voice planning.
- `/future`: future module roadmap and planning records.
- `/readiness`: release readiness plan.

The main production gap is not feature coverage. It is productization: shared navigation, session management, consistent data fetching, consistent components, better task flows, richer information architecture, responsive polish, accessibility, testing, and trust cues.

## 4. Frontend Architecture Strategy

### App Structure

Use the Next.js App Router with route groups:

- Public marketing and onboarding: landing page, sign in, register, privacy, medical disclaimer.
- Authenticated app: Health Hub, profile, vault, reports, prescriptions, timeline, daily health, family, accessibility, future modules.
- Shared mode surfaces: Senior Mode, Doctor Mode, Emergency Mode, simplified dashboard.

Production should introduce:

- A persistent app shell with side navigation on desktop and bottom navigation on mobile.
- A top utility bar for profile switcher, search, language, accessibility controls, notifications, and account menu.
- Shared authenticated API client that stores the DRF token securely in the chosen session strategy.
- Central loading, error, empty, unauthorized, and offline states.
- Feature modules with reusable domain components rather than repeated page-local components.
- Form schemas and validation patterns for profile, document upload, journal, family invite, and preferences.

### Data Fetching

The current pages call `fetch` directly. Production should centralize:

- API base URL and auth header injection.
- Typed endpoint wrappers by domain.
- Error normalization using backend error shape where available.
- Request states: idle, loading, success, empty, validation error, permission error, network error.
- Optimistic refresh only where safe, such as journal entries or preference toggles.
- No optimistic behavior for uploads, analysis, sharing, emergency access, or medication warnings.

### State Model

Use a simple layered state model:

- Server state: profiles, documents, analyses, trends, medications, dashboard, family records.
- Session state: current user, auth token, active profile, language, accessibility preferences.
- UI state: selected analysis, filters, open panels, display density, current mode.
- Sensitive transient state: upload progress, assistant input, emergency share creation confirmation.

## 5. Information Architecture

### Primary Navigation

The authenticated app should use these primary sections:

- Health Hub
- Profile
- Vault
- Reports
- Prescriptions
- Timeline
- Daily Health
- Family Care
- Accessibility

Secondary or admin-like sections:

- Future Modules
- Release Readiness
- Settings
- Help and Safety

### Recommended Navigation Labels

- "Health Hub" for `/hub`.
- "Profile" for `/profile`.
- "Medical Vault" for `/documents`.
- "Report Insights" for `/reports`.
- "Medicines" for `/prescriptions`.
- "Timeline & Trends" for `/trends`.
- "Daily Health" for `/daily`.
- "Family Care" for `/family`.
- "Access & Language" for `/accessibility`.
- "Future Ecosystem" for `/future`.
- "Release Readiness" for `/readiness`.

### Global Search

Plan a future global search that can find documents, biomarkers, medicines, timeline events, journal entries, doctor summaries, and education content. Search results should be grouped by domain and respect permissions.

## 6. Landing Page Strategy

The landing page may use a Bento Grid, and the Bento Grid should be limited to the landing page. Authenticated app pages should use operational layouts, not marketing grids.

Landing page goals:

- Explain MedClaro as a lifelong personal health intelligence platform.
- Establish safety: educational support, not diagnosis.
- Show ecosystem modules without overwhelming users.
- Drive sign up, sign in, and demo exploration.

Landing structure:

- Hero: MedClaro name, short value proposition, primary CTA, secondary safety/privacy link.
- Bento Grid: Health Hub, Medical Vault, Report Insights, Prescription Intelligence, Family Care, Senior Mode, Doctor Summary, Emergency Profile.
- Trust band: privacy, permission control, doctor-ready summaries, multilingual support.
- Workflow strip: create profile, upload documents, understand insights, track timeline, prepare for doctor.
- Safety footer: medical disclaimer, urgent care guidance, privacy summary.

## 7. Design System

### Brand Feel

MedClaro should feel clear, modern, gentle, and medically responsible. Avoid hospital sterility, playful consumer-health gloss, and overuse of blue/green gradients. The interface should be bright, structured, and calming, with severity colors used sparingly and consistently.

### Color Tokens

Foundation:

- Ink: `#17202A` for primary text.
- Surface: `#FFFFFF`.
- App background: `#F7FAFC`.
- Muted surface: `#F1F5F9`.
- Border: `#D8E2EA`.

Brand:

- Claro Blue: `#1F6FEB` for primary actions and selected navigation.
- Claro Mint: `#22A06B` for completed, healthy, consented, or safe states.
- Deep Teal: `#0F766E` for secondary brand emphasis.
- Sky: `#E8F2FF` for quiet informational backgrounds.

Severity:

- Info: blue.
- Good/stable: mint.
- Attention/fluctuating: amber `#B7791F`.
- High risk/worsening: rose `#C2415B`.
- Critical/urgent: red `#B42318`.

Accessibility:

- All text contrast should meet WCAG AA.
- Severity must never rely on color alone; use icons, labels, and text.
- High contrast mode should strengthen borders, text, and focus rings.

### Typography

Use a highly legible sans-serif. Recommended stack:

`Inter`, `ui-sans-serif`, `system-ui`, `Segoe UI`, `Arial`, `sans-serif`.

Type scale:

- Page title: 32px desktop, 26px tablet/mobile.
- Section title: 22px.
- Panel title: 18px.
- Body: 16px default for production health content.
- Supporting text: 14px only for metadata and low-priority context.
- Senior Mode body: 18px minimum, page title 30px, touch labels 17px.

Avoid tiny medical explanations. Biomarker and medication text should prioritize comprehension.

### Spacing And Layout

Use an 8px spacing system:

- Page padding: 24px mobile/tablet, 32px desktop.
- Section spacing: 32px.
- Panel padding: 20px or 24px.
- Compact repeated rows: 12px to 16px.
- Touch target minimum: 44px, Senior Mode 52px.

Cards may be used for repeated items and panels. Keep radius at 8px or less. Do not nest cards inside cards; use sections, rows, and dividers instead.

### Icons

Use `lucide-react` consistently:

- HeartPulse: profile and health status.
- FileText: documents and reports.
- Activity/LineChart: trends.
- Pill: medicines.
- Bot/MessageCircle: assistant.
- Users/UserPlus: family care.
- Stethoscope: doctor mode.
- QrCode: emergency mode.
- Languages/Volume2/Mic/Eye: accessibility.
- ShieldCheck/ShieldAlert/AlertCircle: safety and permission states.

Icons should clarify controls, not decorate dense dashboards.

### Component System

Core components:

- `AppShell`
- `SideNav`
- `MobileNav`
- `TopBar`
- `PageHeader`
- `SectionHeader`
- `MetricTile`
- `StatusBadge`
- `SeverityBadge`
- `SafetyNotice`
- `PermissionNotice`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `InlineValidation`
- `ActionBar`
- `FilterBar`
- `SegmentedControl`
- `Tabs`
- `Drawer`
- `Modal`
- `ConfirmDialog`
- `Timeline`
- `TrendChart`
- `UploadDropzone`
- `AssistantThread`
- `ExplanationLevelSwitcher`
- `SeniorModeToggle`

Domain components:

- `ProfileCompletionCard`
- `HealthContextSummary`
- `DocumentRow`
- `DocumentPreviewPanel`
- `ReportAnalysisSummary`
- `BiomarkerAccordion`
- `BiomarkerTrendCard`
- `MedicationCard`
- `MedicationWarningPanel`
- `ReminderScheduleRow`
- `DailyCheckInForm`
- `JournalEntryRow`
- `CareCircleMemberRow`
- `PermissionMatrix`
- `DoctorSummaryPreview`
- `EmergencyProfileCard`
- `LanguagePreferencePanel`
- `VoiceSummaryPanel`

## 8. Module Layout Strategy

### Health Hub

The Health Hub should become the authenticated home screen.

Desktop:

- Top band: greeting, profile completeness, current health score/status, top action.
- Left or main column: ranked alerts, today actions, recent timeline.
- Right column: assistant, reminders, family updates.
- Bottom: trends snapshot and latest documents.

Mobile:

- Health score and top alert first.
- Today actions second.
- Assistant access as a sticky or prominent action.
- Timeline and details below.

### Profile

Convert the single long form into guided sections:

- Basic details.
- Health context: allergies, conditions, family history.
- Lifestyle and preferences.
- Emergency contacts.
- Consent and data use.

Use completion states and save progress. Inline medical context should explain why fields matter without creating fear.

### Medical Vault

Use a two-step workflow:

1. Upload or drag a document.
2. Classify, date, confirm privacy, and route to report or prescription analysis.

Document history should support filters, search, preview, status, and next action.

### Report Insights

Recommended layout:

- Summary header: report name, date, health score, status, safety review.
- Key findings: prioritized, with severity labels.
- Biomarkers: expandable table/accordion with current value, range, status, trend, explanations.
- Explanation level switcher: Grandma, Simple, Detailed, Medical Student, Doctor Mode.
- Doctor discussion prompts.
- Disclaimer and source metadata.

### Timeline & Trends

Use two coordinated views:

- Timeline view: events grouped by year/month.
- Biomarker trends view: filterable chart and insight details.

Trend charts must include accessible table fallbacks and clear "not enough data" states.

### Prescriptions / Medicines

Separate prescription analysis from active medication management:

- Prescription history.
- Current medicines.
- Safety warnings.
- Reminder schedules.
- Food/alcohol/driving/pregnancy notes.
- Duplicate and interaction awareness.

High-severity warnings should be prominent and action-oriented.

### Daily Health

Make daily logging fast:

- Quick check-in for mood, stress, sleep, energy, pain, symptoms.
- Journal entry with tags.
- Recent patterns.
- Lifestyle plans separated into diet and exercise tabs.

Avoid making users fill long forms daily.

### Family Care

Primary sections:

- Care circles.
- Members and roles.
- Permission matrix.
- Family updates.
- Doctor Mode.
- Emergency Mode.

Permission editing must be explicit, auditable, and easy to understand.

### Accessibility

Treat accessibility as a user setting and a product surface:

- Language.
- Text size.
- Senior Mode.
- High contrast.
- Reduce motion.
- Voice summaries.
- Read-aloud targets.
- One-click actions.

Settings should preview how the app changes.

### Future Modules

Keep this page as an internal roadmap/admin surface until future modules become user-ready. Production users should not see sample-create actions unless clearly marked as planning/demo.

### Release Readiness

Keep as internal/admin-only. It should not appear in consumer navigation.

## 9. User Flows

### First-Time User

1. Landing page.
2. Register or sign in.
3. Guided health profile creation.
4. Privacy consent.
5. Upload first report or prescription.
6. View analysis.
7. Land on Health Hub with next actions.

### Returning User

1. Health Hub.
2. Review alerts, reminders, timeline, family updates.
3. Ask assistant or continue a recommended action.
4. Upload new documents or log daily health.

### Report Analysis

1. Upload lab report in Medical Vault.
2. Confirm document type and source date.
3. Run analysis.
4. Review health score, findings, biomarkers, and safety notes.
5. Save doctor questions.
6. Timeline and trends update.

### Prescription Review

1. Upload prescription.
2. Run medication analysis.
3. Review medicines, dosage, schedule, and warnings.
4. Confirm reminders.
5. Ask pharmacist/doctor prompts as needed.

### Family Care

1. Create care circle.
2. Invite member.
3. Assign role.
4. Review permission matrix.
5. Monitor shared updates.
6. Revoke or adjust access.

### Emergency Mode

1. Confirm emergency profile data.
2. Create time-limited share.
3. Show QR and share link.
4. Display expiry and revoke controls.

## 10. Accessibility And Senior-Friendly Requirements

Baseline:

- Keyboard navigable app shell and all forms.
- Visible focus rings.
- Semantic headings.
- Form labels tied to inputs.
- Error messages announced and placed near fields.
- Chart alternatives in table form.
- Touch target minimum 44px.
- No text smaller than 14px for meaningful content.
- Reduced motion support.
- No essential information conveyed only by color.

Senior Mode:

- Larger text and controls.
- Simplified Health Hub.
- Fewer visible actions per screen.
- One-click actions: call emergency contact, show emergency profile, read latest summary, ask assistant.
- Voice summary/read-aloud affordances.
- Extra confirmation for sharing and emergency links.

## 11. Animation And Interaction Guidelines

Use motion only to improve comprehension:

- 120ms to 180ms for hover/focus transitions.
- 180ms to 240ms for drawers and modals.
- Skeletons for loading dashboard and lists.
- Progress indicators for upload and AI analysis.
- Respect `prefers-reduced-motion`.

Avoid:

- Decorative motion on clinical or emergency content.
- Auto-advancing carousels.
- Confetti, celebratory effects, or playful transitions around medical findings.

## 12. Responsive Strategy

Mobile:

- Bottom navigation for top sections.
- Single-column content.
- Sticky primary action where useful.
- Collapsible filters.
- Full-screen assistant and upload flows.

Tablet:

- Two-column layouts for dashboard and forms.
- Side panels may become drawers.

Desktop:

- Persistent left navigation.
- Top utility bar.
- Two or three column dashboards.
- Split views for history list plus detail panel.

## 13. Development Roadmap Summary

Recommended phase sequence:

1. Foundation and frontend architecture.
2. Design system and app shell.
3. Authentication, onboarding, and profile.
4. Medical Vault, reports, and trends.
5. Prescriptions, daily health, and Health Hub.
6. Family Care, Doctor Mode, Emergency Mode.
7. Accessibility, multilingual, voice, and senior mode.
8. Testing, performance, release polish, and documentation.

Each phase has a dedicated implementation document in this folder.

## 14. Definition Of Frontend Completion

The frontend redesign is complete when:

- Users can authenticate without raw token fields on feature pages.
- Health Hub is the primary authenticated home.
- All major modules share one app shell and design system.
- Profile, Vault, Reports, Prescriptions, Trends, Daily Health, Family Care, and Accessibility have production flows.
- AI outputs have consistent source, safety, and disclaimer patterns.
- Family and emergency sharing show permissions and expiry clearly.
- Senior Mode and high contrast are usable end to end.
- Mobile, tablet, and desktop layouts are tested.
- Critical flows have browser tests.
- Loading, empty, error, permission, and offline states are handled consistently.
- Internal readiness/future pages are not confused with consumer health workflows.

