# Frontend Phase 02 - Design System And App Shell

## Objective

Build the production visual language and shared shell that every MedClaro module uses. This phase turns the app from separate prototype pages into one coherent health product.

## Design Direction

MedClaro should feel calm, trustworthy, and useful. The design should be operational and information-rich, not decorative. Use color, hierarchy, and spacing to support comprehension and safety.

## App Shell

Desktop:

- Persistent left navigation.
- Top utility bar with search, language, accessibility controls, notifications, and account menu.
- Main content area with max-width rules per page type.
- Optional right rail for assistant, reminders, or context summaries.

Mobile:

- Top bar with MedClaro, profile/menu, and emergency shortcut.
- Bottom navigation for core sections.
- Full-screen drawers for filters, assistant, and navigation overflow.

Tablet:

- Compact side navigation or collapsible rail.
- Two-column module layouts where space permits.

## Navigation Groups

Primary:

- Health Hub
- Profile
- Medical Vault
- Report Insights
- Medicines
- Timeline & Trends
- Daily Health
- Family Care
- Access & Language

Secondary:

- Settings
- Help & Safety
- Future Ecosystem
- Release Readiness

## Core Components

- `AppShell`
- `SideNav`
- `TopBar`
- `MobileNav`
- `PageHeader`
- `MetricTile`
- `StatusBadge`
- `SeverityBadge`
- `SafetyNotice`
- `PermissionNotice`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ActionBar`
- `FilterBar`
- `Tabs`
- `SegmentedControl`
- `Drawer`
- `Modal`
- `ConfirmDialog`
- `FormField`
- `Toggle`
- `Tooltip`

## Design Tokens

Colors:

- Text: `#17202A`.
- Background: `#F7FAFC`.
- Surface: `#FFFFFF`.
- Muted surface: `#F1F5F9`.
- Border: `#D8E2EA`.
- Primary: `#1F6FEB`.
- Success/stable: `#22A06B`.
- Attention: `#B7791F`.
- Warning/high risk: `#C2415B`.
- Critical: `#B42318`.

Typography:

- Base body: 16px.
- Metadata: 14px.
- Page titles: 26px to 32px.
- Section titles: 20px to 22px.
- Senior Mode body: 18px minimum.

Spacing:

- Use 8px increments.
- Page gutters: 24px mobile, 32px desktop.
- Panel padding: 20px to 24px.
- Touch target: 44px minimum, 52px in Senior Mode.

## Component Behavior

- Badges must include readable text, not just color.
- Buttons use icons where icons improve recognition.
- Destructive or sensitive actions require confirmation.
- Uploads and AI analysis require progress states.
- Empty states should include the next useful action.
- Error states should explain recovery steps.

## Landing Page Rule

Bento Grid is allowed only on the public landing page. Authenticated dashboards and feature pages must use operational layouts such as metric strips, split panes, tables, timelines, accordions, and task panels.

## Accessibility Requirements

- WCAG AA contrast.
- Visible focus states.
- Keyboard navigation.
- Semantic headings.
- Screen-reader labels for icon buttons.
- Reduced motion support.
- High contrast variant.

## Completion Checklist

- [x] App shell layout specified for desktop, tablet, and mobile.
- [x] Navigation hierarchy finalized.
- [x] Design tokens finalized.
- [x] Core components listed with behavior expectations.
- [x] Landing page Bento Grid restriction documented.
- [x] Accessibility requirements included in component acceptance criteria.

## Implementation Notes

Phase 02 has been implemented in the frontend codebase:

- `frontend/components/app-shell.tsx` now provides the production app shell, desktop side navigation, tablet icon rail, top utility bar, mobile bottom navigation, secondary navigation, emergency shortcut, and persistent safety language.
- `frontend/components/design-system.tsx` defines reusable UI primitives for page headers, section headers, metric tiles, status and severity badges, safety and permission notices, action/filter bars, tabs, segmented controls, drawer, modal, confirmation dialog, form field, toggle, tooltip, and inline status text.
- `frontend/tailwind.config.ts` includes the MedClaro color tokens, surface tokens, border token, critical state, and app shadows.
- `frontend/app/globals.css` includes base typography, focus-visible styles, text selection, high-contrast variables, Senior Mode sizing hook, and reduced-motion handling.
- `frontend/lib/ui.ts` adds a small className helper for shared component composition.

Verified with `npm.cmd run build`.
