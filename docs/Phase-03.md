# Phase 03 - Medical Document Upload and Storage

## Objectives

- Enable secure upload and organization of medical documents.
- Prepare documents for AI analysis.
- Build a Medical Vault foundation for reports, prescriptions, invoices, insurance, scans, and future records.

## Features to Build

- Document upload flow.
- Document type classification.
- Report upload.
- Prescription upload.
- Secure document metadata storage.
- Document processing status tracking.
- Document history list.
- Basic Medical Vault structure.
- User-owned document access controls.

## Development Tasks

- Define supported file types such as PDF, image formats, and common document formats.
- Define document size limits.
- Design document metadata model.
- Design upload status lifecycle:
  - Uploaded.
  - Queued.
  - Processing.
  - Analyzed.
  - Failed.
  - Needs review.
- Plan document preview behavior.
- Plan document deletion and retention behavior.
- Define access control rules for user-owned documents.
- Define storage strategy for local development and production.
- Define OCR or text extraction integration points if needed.
- Ensure upload records can connect to future report and prescription analysis.

## Dependencies

- Phase 01 architecture.
- Phase 02 user identity and ownership.
- Secure file storage decision.
- Audit logging strategy.

## Expected Deliverables

- Document model plan.
- Upload API plan.
- Frontend upload flow plan.
- Document status lifecycle.
- Medical Vault foundation.
- Security rules for document access.

## Implementation Notes

- Medical document metadata is implemented in `backend/documents/models.py`.
- Supported document categories include lab reports, prescriptions, scans,
  insurance, invoices, and other medical vault records.
- Upload validation allows PDF, image, DOC, and DOCX files and enforces the
  `DJANGO_MAX_UPLOAD_MB` size limit.
- Document lifecycle statuses are implemented:
  - uploaded
  - queued
  - processing
  - analyzed
  - failed
  - needs_review
- Document APIs are owner-scoped under `/api/v1/documents/`.
- Preview and download routes stream owned files through authenticated API
  endpoints.
- Deletion is implemented as soft deletion with `is_deleted` and `deleted_at`.
- Document audit events are recorded for upload, preview, download, and delete.
- Analysis handoff metadata is stored in `analysis_handoff` for future report
  and prescription AI workflows.
- Frontend Medical Vault UI is available at `/documents`.
- Backend tests cover upload, file validation, owner scoping, and soft deletion.

## Completion Checklist

- [x] Document upload flow is specified.
- [x] Document metadata fields are defined.
- [x] Supported file types are defined.
- [x] Status lifecycle is defined.
- [x] Access control rules are defined.
- [x] Document history view is planned.
- [x] Analysis handoff structure is planned.
