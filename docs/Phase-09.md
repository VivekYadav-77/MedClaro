# Phase 09 - Family Care Circle, Doctor Mode, and Emergency Mode

## Objectives

- Enable family-based care without compromising privacy.
- Provide doctor-ready clinical summaries.
- Provide emergency access to critical health information.

## Features to Build

- Family Care Circle.
- Family roles:
  - Owner.
  - Parent.
  - Child.
  - Doctor.
  - Caregiver.
  - Emergency Contact.
- Permission-based access controls.
- Family dashboard updates.
- Family alerts.
- Doctor Mode export.
- Dedicated Gemini doctor summary instance and API key.
- Emergency Mode.
- Emergency QR code.
- Emergency profile sharing controls.

## Development Tasks

- Define family group model.
- Define role model.
- Define permission grant model.
- Define invitation and acceptance flow.
- Define revocation flow.
- Define audit logs for family access.
- Define what data each permission allows.
- Design family dashboard UI.
- Define family alert rules.
- Define doctor summary schema:
  - Patient identity.
  - Known conditions.
  - Allergies.
  - Current medicines.
  - Recent reports.
  - Important biomarker trends.
  - Risk factors.
  - Symptoms.
  - Questions for doctor.
- Define emergency profile schema:
  - Blood group.
  - Allergies.
  - Current medicines.
  - Known diseases.
  - Emergency contacts.
  - Insurance.
  - Doctor contacts.
- Define QR access security and expiration strategy.
- Design export formats for doctor summary.

## Dependencies

- Phase 02 profile.
- Phase 04 reports.
- Phase 05 timeline and trends.
- Phase 06 medications.
- Phase 07 Health Hub.
- Gemini doctor summary API key.
- Strong permission and audit architecture.

## Expected Deliverables

- Family Care Circle plan.
- Permission model plan.
- Doctor Mode summary plan.
- Emergency Mode plan.
- QR sharing strategy.
- Family and emergency UI plans.

## Implementation Notes

- Added `family_care` Django app for Family Care Circle, Doctor Mode, Emergency Mode, permissions, invitations, and audit logs.
- Added owner-scoped APIs under `/api/v1/family-care/`:
  - `/dashboard/` for family dashboard alerts and audit history.
  - `/circles/` for care circle creation and listing.
  - `/circles/<id>/invite/` for invitation creation.
  - `/circles/<id>/members/<membership_id>/revoke/` for revocation.
  - `/circles/<id>/audit/` for audit log retrieval.
  - `/doctor-summaries/` for doctor-ready summary generation and history.
  - `/emergency-shares/` for emergency profile share creation/listing.
  - `/emergency-shares/<token>/public/` for time-limited emergency access.
- Added family roles:
  - `owner`
  - `parent`
  - `child`
  - `doctor`
  - `caregiver`
  - `emergency_contact`
- Added permission grants for profile, reports, trends, medications, symptoms, journal, doctor summary, and emergency profile access.
- Added invitation, acceptance, revocation, and audit models.
- Added doctor summary schema using profile, conditions, allergies, medicines, recent reports, trends, risk factors, symptoms, journal patterns, and doctor questions.
- Preserved the dedicated Gemini doctor summary boundary through `GEMINI_DOCTOR_SUMMARY_MODEL`.
- Added emergency profile schema with blood group, allergies, medicines, known diseases, emergency contacts, insurance placeholders, doctor contact placeholders, and safety notes.
- Added emergency share token, QR payload, expiry, active/revoked state, public access endpoint, and last-access timestamp.
- Added frontend Family Care page at `/family` with care circle creation, invitation, doctor summary generation, emergency share creation, and QR payload display.
- Full email delivery, real QR image rendering, document/PDF export, and cross-account invitation acceptance UX remain future production integrations.

## Completion Checklist

- [x] Family roles are defined.
- [x] Permission rules are defined.
- [x] Invitation flow is specified.
- [x] Audit requirements are specified.
- [x] Doctor summary schema is defined.
- [x] Emergency profile schema is defined.
- [x] QR access strategy is defined.
- [x] Frontend views are specified.
