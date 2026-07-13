# Frontend Phase 06 - Family Care, Doctor Mode, And Emergency Mode

## Objective

Design production-grade sharing, care collaboration, doctor summaries, and emergency access. These features are sensitive and must be permission-first, transparent, and safe.

## Family Care Strategy

Family Care should clearly show:

- Which circles exist.
- Who is in each circle.
- What role each member has.
- Which permissions are allowed.
- What is pending, active, expired, or revoked.
- Recent access/audit activity when available.

Avoid hiding permissions behind vague role names. Role presets are useful, but users must see actual permissions.

## Permission Matrix

Rows:

- Members.

Columns:

- Profile.
- Reports.
- Trends.
- Medications.
- Symptoms.
- Journal.
- Doctor Summary.
- Emergency Profile.

Each permission should show:

- Allowed or not allowed.
- Expiry if present.
- Granted by.
- Last changed when available.

## Doctor Mode Strategy

Doctor Mode should generate and preview structured summaries:

- Patient identity and profile basics.
- Allergies.
- Known conditions.
- Current medicines.
- Recent reports.
- Trends and risk factors.
- Recent symptoms/journal notes.
- Questions for doctor.
- Generated metadata and disclaimer.

The UI should support preview, print, PDF export in a future phase, and copy-friendly sections.

## Emergency Mode Strategy

Emergency Mode should be one of the simplest and clearest flows:

1. Review emergency profile.
2. Confirm active medicines, allergies, blood group, conditions, emergency contacts.
3. Create time-limited share.
4. Show QR/link, expiry, and revoke.
5. Provide Senior Mode one-click access.

Critical rule: users must understand that emergency shares are public to anyone with the link until expiry or revocation.

## Component Needs

- `CareCircleList`
- `MemberRoleBadge`
- `PermissionMatrix`
- `InviteMemberForm`
- `AccessAuditList`
- `DoctorSummaryPreview`
- `DoctorSummarySection`
- `EmergencyProfileReview`
- `EmergencySharePanel`
- `QrDisplay`
- `RevokeShareDialog`

## Responsive Behavior

Mobile:

- Permission matrix becomes member detail cards.
- Doctor summary uses anchored sections.
- Emergency Mode uses full-screen review and QR display.

Desktop:

- Circle list plus member/detail split view.
- Permission matrix table.
- Doctor summary preview and actions side by side.

## Accessibility And Trust

- Confirm destructive or sensitive actions.
- Use plain-language permission labels.
- Show expiry in absolute and relative terms.
- Include print-friendly emergency profile.
- Large emergency actions in Senior Mode.

## Dependencies

- Family care APIs.
- Profile, reports, trends, medicines, daily health for doctor summary content.
- Accessibility preferences for Senior Mode.

## Completion Checklist

- [ ] Family circle IA defined.
- [ ] Permission matrix specified.
- [ ] Invite/revoke/expiry UX defined.
- [ ] Doctor summary sections defined.
- [ ] Emergency share flow defined.
- [ ] Senior-friendly emergency behavior defined.

