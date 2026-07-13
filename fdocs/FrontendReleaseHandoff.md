# MedClaro Frontend Release Handoff

## Scope

This handoff packages the redesigned frontend for QA, release gating, and next-phase development. It pairs with `FrontendPhase-08.md` and the internal `/readiness` surface.

## Component Inventory

- App shell: desktop side navigation, tablet rail, top utility bar, mobile navigation, emergency shortcut, accessibility menu.
- App states: loading, empty, error, unauthorized, permission states.
- Design system: page and section headers, metric tiles, badges, safety notices, permission notices, action bars, filters, tabs, segmented controls, drawers, modals, confirm dialogs, form fields, toggles, tooltips, inline validation, success and info lines.
- Feature-local components: profile wizard steps, vault document rows and drawers, report biomarker accordions, trend cards and fallback tables, Health Hub status and assistant panels, medicine cards, daily check-in, permission matrix, doctor summary preview, emergency share panel, accessibility controls, release readiness panels.

## Route Map

- `/`: public product entry.
- `/signin`: session sign in.
- `/register`: account creation.
- `/privacy`: privacy policy.
- `/medical-disclaimer`: medical safety notice.
- `/hub`: authenticated home, alerts, actions, assistant.
- `/profile`: Personal Health Profile onboarding and editing.
- `/documents`: Medical Vault upload, filters, document history.
- `/reports`: report analysis, biomarkers, explanation levels.
- `/trends`: timeline, trends, chart alternatives.
- `/prescriptions`: prescription analysis, medicines, warnings, schedules.
- `/daily`: symptom logging, journal, lifestyle plans.
- `/family`: care circles, permission matrix, doctor summary, emergency shares.
- `/accessibility`: language, Senior Mode, voice, read-aloud, one-click actions.
- `/future`: internal future ecosystem planning.
- `/readiness`: internal QA, security, deployment, and handoff package.

## API Endpoint Map

- `/accounts/`: registration, login, logout, current user.
- `/profiles/`: profile creation, retrieval, update.
- `/documents/`: upload, list, download, soft-delete.
- `/report-analyses/`: report analysis workflows.
- `/health-trends/`: trend insights and timeline.
- `/prescriptions/`: prescription analyses and medicines.
- `/health-hub/`: dashboard, assistant context, assistant turns.
- `/daily-health/`: symptoms, journal, lifestyle plans.
- `/family-care/`: circles, invitations, audit, doctor summaries, emergency shares.
- `/accessibility/`: preferences, localization artifacts, voice summaries, simplified dashboard.
- `/future-modules/`: roadmap and future planning records.
- `/release-readiness/`: release readiness plan.

## Design Tokens

Tailwind extends `claro` tokens:

- `ink`, `background`, `surface`, `muted`, `border`
- `blue`, `mint`, `amber`, `rose`, `critical`, `teal`, `sky`
- Shadows: `shell`, `panel`

Global attributes apply accessibility preferences:

- `data-contrast`
- `data-senior-mode`
- `data-text-size`
- `data-reduce-motion`

## Critical Browser Test List

- Register and sign in.
- Complete profile onboarding.
- Upload a document.
- Run report analysis.
- Review biomarkers and explanation levels.
- Refresh timeline and trends.
- Run prescription analysis.
- Review medication warnings.
- Load Health Hub and send assistant message.
- Log symptom and journal entry.
- Generate lifestyle plan.
- Create care circle and invite member.
- Generate doctor summary.
- Create and revoke emergency share.
- Change accessibility preferences.
- Use Senior Mode simplified dashboard.

## Component Test List

- Form validation.
- Error rendering.
- Severity badge logic.
- Permission matrix behavior.
- Explanation level switcher.
- Upload state transitions.
- Assistant message states.
- Trend chart fallback table.
- Senior Mode sizing behavior.

## Responsive QA Matrix

- 360px: no text overlap, mobile navigation usable, tables become cards.
- 430px: forms remain readable, sticky actions do not cover content, emergency QR fits.
- 768px: compact rail usable, drawers fit, assistant/upload panels fit.
- 1366px: split views balanced, matrices scroll predictably, cards do not nest awkwardly.
- 1440px+: max-width content holds, right rails align, tables remain scannable.

## Accessibility QA Checklist

- Keyboard-only flow.
- Focus visibility.
- Screen-reader labels for icon buttons.
- Reduced motion.
- High contrast.
- Text zoom to 200%.
- Chart text alternatives.
- Error announcement.
- Modal focus trap.
- Emergency Mode with Senior Mode.

## Performance Targets

- Keep Health Hub fast to interactive.
- Lazy-load heavy charts, internal pages, and future modules.
- Avoid loading every module's data on app start.
- Use loading states for dashboard panels and long-running actions.
- Compress and optimize visual assets.
- Keep bundle growth visible during CI via Next.js build output.

## Known Limitations

- No Playwright suite is committed yet.
- Some components remain page-local and can be extracted after behavior stabilizes.
- Voice controls create planned artifacts but do not play provider audio yet.
- Schedule editing for medicines is display-oriented until the backend supports mutation.
- Chart rendering remains simple and should gain richer accessible visualization tests.
- Internal planning pages are session-gated but do not yet enforce staff/admin roles.

## Next-Release Backlog

- Add Playwright critical-flow tests.
- Add React Testing Library coverage for shared components.
- Add staff/admin authorization for internal pages.
- Add bundle-size reporting to CI.
- Extract repeated page-local panels into shared components.
- Add true audio provider integration for read-aloud.
- Add stronger chart alternatives and snapshot coverage.
