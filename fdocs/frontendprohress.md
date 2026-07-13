# MedClaro Frontend Progress

> Document type: Frontend progress handoff  
> Purpose: Help future AI agents quickly understand frontend redesign planning status  
> Current status: Phase 02 design system and app shell implemented; Phase 03 authentication, onboarding, and profile next  
> Last updated: 2026-07-13

---

## Current Frontend State

The MedClaro frontend is currently a working Next.js 14 App Router application with Phase 02 production foundation work in place: public/authenticated/internal route groups, shared session handling, centralized API helpers, auth entry screens, internal surface gating, a production app shell, design tokens, and shared UI primitives.

The frontend has route-level pages for all major backend modules. The raw-token prototype pattern has been removed from feature pages, and the shared app shell/design system now exists. The module pages still need gradual migration onto the shared components, deeper flow redesign, accessibility polish, and production-ready responsive QA.

## Completed Frontend Planning Work

The full project was reviewed before frontend planning:

- Product vision in `Description.md`.
- Ecosystem design ideas in `Design.txt`.
- Backend/frontend status in `README.md`.
- Existing implementation roadmap in `docs/MasterPlan.md`.
- Architecture baseline in `docs/Architecture.md`.
- Completed phase status in `docs/Progress.md`.
- Release-readiness plan in `docs/ReleaseReadiness.md`.
- Current frontend routes under `frontend/app`.
- Current API helper in `frontend/lib/api.ts`.
- Tailwind theme in `frontend/tailwind.config.ts`.
- Backend models, services, and API domains relevant to frontend workflows.

## New Frontend Documentation Created

Frontend planning docs now live in `fdocs/`:

- `FrontendMasterPlan.md`: complete production frontend redesign strategy.
- `FrontendPhase-01.md`: foundation, routing, API client, auth, and state architecture.
- `FrontendPhase-02.md`: design system, tokens, components, and app shell.
- `FrontendPhase-03.md`: authentication, onboarding, and Personal Health Profile.
- `FrontendPhase-04.md`: Medical Vault, reports, biomarkers, timeline, and trends.
- `FrontendPhase-05.md`: Health Hub, medicines, assistant, daily health, and lifestyle planning.
- `FrontendPhase-06.md`: Family Care, Doctor Mode, Emergency Mode, and permissions.
- `FrontendPhase-07.md`: accessibility, multilingual support, voice, and Senior Mode.
- `FrontendPhase-08.md`: QA, performance, release polish, and developer handoff.

## Current Prototype Routes

The frontend currently includes:

- `/`: prototype dashboard/landing with links.
- `/profile`: Personal Health Profile form.
- `/documents`: Medical Vault upload and document history.
- `/reports`: report analysis and biomarker display.
- `/trends`: report history, timeline, and biomarker trend graph.
- `/prescriptions`: prescription analysis, medicines, warnings, and schedules.
- `/hub`: Health Hub dashboard and contextual assistant.
- `/daily`: symptoms, journal, diet, and exercise planning.
- `/family`: Family Care, Doctor Mode, and Emergency Mode.
- `/accessibility`: language, senior mode, voice, and simplified dashboard planning.
- `/future`: future module roadmap and planning records.
- `/readiness`: release readiness planning UI.

## Important Current Limitations

- Authentication still uses the current DRF token backend, but the token is now hidden behind a shared frontend session abstraction.
- Some feature pages still use page-local helper functions on top of the centralized API client.
- Components are mostly page-local and duplicated.
- Some feature pages still need to adopt the new shared design-system primitives.
- Accessibility and Senior Mode are planned but not applied globally.
- Mobile layouts exist through Tailwind grids but need production QA and refinement.
- Charts need better accessibility alternatives and responsive polish.
- Medical safety notices are present but not yet standardized across all AI surfaces.

## Implemented Phase 01 Work

- Created App Router route groups for public, authenticated, and internal surfaces.
- Added `/signin`, `/register`, `/privacy`, and `/medical-disclaimer`.
- Added a shared client-side session provider that stores the current DRF token behind a product session abstraction.
- Centralized API base URL, auth header injection, JSON requests, multipart uploads, and normalized API errors in `frontend/lib/api.ts`.
- Replaced page-level API token inputs and local feature-page `fetch` calls with shared API/session helpers.
- Added shared app state components for loading, empty, error, unauthorized, and permission states.
- Added an authenticated app shell with desktop side navigation, mobile navigation, top utility bar, session visibility, and medical safety language.
- Added an internal layout banner for Future Modules and Release Readiness.
- Verified the frontend with `npm.cmd run build`.

## Implemented Phase 02 Work

- Expanded `frontend/tailwind.config.ts` with MedClaro design tokens for text, background, surface, muted surface, border, primary, stable, attention, risk, critical, teal, sky, and shared shadows.
- Added global base typography, focus-visible styling, high-contrast variables, Senior Mode sizing hook, and reduced-motion handling in `frontend/app/globals.css`.
- Rebuilt `frontend/components/app-shell.tsx` with desktop side navigation, tablet compact rail, top utility bar, mobile bottom navigation, emergency shortcut, language/accessibility shortcut, secondary navigation, and persistent safety messaging.
- Added shared design-system primitives in `frontend/components/design-system.tsx`: page/section headers, metric tiles, status/severity badges, safety/permission notices, action/filter bars, tabs, segmented controls, drawer, modal, confirmation dialog, form field, toggle, tooltip, and inline status text.
- Added `frontend/lib/ui.ts` for shared class name composition.
- Verified the frontend with `npm.cmd run build`.

## Recommended Next Work

Continue with `FrontendPhase-03.md`, then proceed in order.

Recommended implementation sequence:

1. Upgrade authentication, onboarding, and profile flows from `FrontendPhase-03.md`.
2. Convert `/hub` into the fully redesigned authenticated home screen.
3. Migrate module pages onto the shared design-system primitives during each phase.
4. Upgrade each module route using the remaining phase docs.
5. Add accessibility, Senior Mode, responsive QA, and browser tests before release.

## Frontend Design Direction

The production UI should feel:

- Calm.
- Trustworthy.
- Senior-friendly.
- Privacy-first.
- Operational and scannable.
- Clear about AI safety and medical limitations.

Avoid making authenticated app pages look like marketing pages. Use Bento Grid only on the public landing page, as specified in `FrontendMasterPlan.md`.

## Key Product Principles To Preserve

- The Personal Health Profile is the center of the ecosystem.
- The Health Hub should become the primary authenticated home.
- The Medical Vault is the user-owned source of truth for health documents.
- AI explains and prepares; it does not diagnose.
- Health Timeline turns isolated records into a lifelong health journey.
- Family Care must be permission-first and auditable.
- Emergency Mode must be simple, clear, time-limited, and easy to revoke.
- Accessibility, language, voice, and Senior Mode must be treated as core product behavior.

## Suggested Completion Tracking

Use this checklist as implementation progresses:

- [x] Phase 01 implemented: route groups, API client, auth/session, common states.
- [x] Phase 02 implemented: app shell, design tokens, shared components.
- [ ] Phase 03 implemented: register, login, onboarding, profile editor.
- [ ] Phase 04 implemented: Vault, reports, biomarkers, timeline, trends.
- [ ] Phase 05 implemented: Health Hub, medicines, assistant, daily health.
- [ ] Phase 06 implemented: Family Care, Doctor Mode, Emergency Mode.
- [ ] Phase 07 implemented: accessibility, multilingual, voice, Senior Mode.
- [ ] Phase 08 implemented: QA, performance, release polish, developer handoff.

## Notes For Future AI Agents

- Do not begin frontend implementation by restyling individual pages in isolation.
- Start with shared architecture and app shell first.
- Preserve existing backend API behavior unless the user asks for backend changes.
- Do not remove existing user or agent changes without checking git status.
- Keep implementation consistent with the planning docs in `fdocs/`.
- For production UX, replace prototype language like "API token" and "Load Plan" with user-centered flows and labels.
- Keep medical safety language visible and consistent across AI-generated content.
