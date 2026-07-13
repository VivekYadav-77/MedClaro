# Frontend Phase 01 - Foundation And Architecture

## Objective

Create the frontend foundation needed to replace prototype pages with a maintainable production app. This phase does not redesign every screen visually; it establishes structure, routing, data access, state conventions, and safety language patterns that all later phases use.

## Priorities

- Introduce a clear route architecture for public, authenticated, and internal pages.
- Remove page-level API token inputs from the target architecture.
- Centralize API access, auth headers, and error handling.
- Define common app states for loading, empty, error, unauthorized, and permission-denied conditions.
- Establish frontend conventions for medical safety, AI metadata, source attribution, and disclaimers.

## Current Problems To Solve

- Each feature page owns its own token field and fetch logic.
- Repeated visual patterns exist without reusable components.
- Error states are generic and not actionable.
- Pages are isolated instead of feeling like one product.
- Internal pages such as Future Modules and Release Readiness are mixed into the main prototype navigation.

## Target Route Groups

- Public:
  - `/`
  - `/signin`
  - `/register`
  - `/privacy`
  - `/medical-disclaimer`
- Authenticated:
  - `/hub`
  - `/profile`
  - `/documents`
  - `/reports`
  - `/prescriptions`
  - `/trends`
  - `/daily`
  - `/family`
  - `/accessibility`
- Internal/admin:
  - `/future`
  - `/readiness`

## Architecture Deliverables

- Shared API client plan with:
  - Base URL from `NEXT_PUBLIC_API_URL`.
  - Auth header injection.
  - JSON and multipart helpers.
  - Typed endpoint groups by backend domain.
  - Error normalization.
- Session plan with:
  - Register, login, logout, current user.
  - Token persistence strategy.
  - Expired/invalid token recovery.
  - Route protection.
- State plan with:
  - Server state conventions.
  - UI state conventions.
  - Sensitive transient state rules.
- Internal page gating plan for Future Modules and Release Readiness.

## Shared API Domains

- Accounts: register, login, logout, me.
- Profiles: profile CRUD, AI context.
- Documents: list, upload, detail, status, preview, download, soft delete.
- Report analyses: create, list, status, detail.
- Health trends: reports, timeline, biomarkers, insights.
- Prescriptions: analyses and medications.
- Health Hub: dashboard, memory context, assistant conversations, assistant turns.
- Daily Health: symptoms, journal, lifestyle plans.
- Family Care: circles, invites, summaries, emergency shares.
- Accessibility: preferences, plan, simplified dashboard, localization, voice summaries.
- Future Modules and Release Readiness: internal/planning only.

## Medical Safety UI Rules

- Every AI-generated surface must show model/prompt metadata where useful, but user-facing pages should translate it into "Generated summary" details rather than raw debug text.
- Use consistent labels:
  - "Extracted from document"
  - "AI explanation"
  - "Doctor discussion prompt"
  - "Safety note"
  - "Not a diagnosis"
- Urgent or severe content gets an explicit care guidance panel.
- Do not hide disclaimers at the bottom when content includes high severity warnings.

## Dependencies

- Backend API remains DRF token based for current release.
- Later OAuth/session upgrades can fit behind the same frontend session abstraction.
- Design system phase depends on this route and state architecture.

## Completion Checklist

- [x] Route groups documented and approved.
- [x] API client conventions documented.
- [x] Auth/session conventions documented.
- [x] Error, empty, loading, unauthorized, and permission states defined.
- [x] Medical safety and AI metadata display rules defined.
- [x] Internal pages separated from consumer navigation plan.
