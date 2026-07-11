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

## Completion Checklist

- [ ] Family roles are defined.
- [ ] Permission rules are defined.
- [ ] Invitation flow is specified.
- [ ] Audit requirements are specified.
- [ ] Doctor summary schema is defined.
- [ ] Emergency profile schema is defined.
- [ ] QR access strategy is defined.
- [ ] Frontend views are specified.
