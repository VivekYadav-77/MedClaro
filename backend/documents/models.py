from django.conf import settings
from django.db import models


def document_upload_path(instance, filename: str) -> str:
    return f"medical_documents/user_{instance.owner_id}/{filename}"


class MedicalDocument(models.Model):
    class DocumentType(models.TextChoices):
        LAB_REPORT = "lab_report", "Lab report"
        PRESCRIPTION = "prescription", "Prescription"
        SCAN = "scan", "Scan or imaging"
        INSURANCE = "insurance", "Insurance"
        INVOICE = "invoice", "Invoice"
        OTHER = "other", "Other"

    class ProcessingStatus(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        ANALYZED = "analyzed", "Analyzed"
        FAILED = "failed", "Failed"
        NEEDS_REVIEW = "needs_review", "Needs review"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medical_documents",
    )
    title = models.CharField(max_length=180)
    document_type = models.CharField(
        max_length=32,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    file = models.FileField(upload_to=document_upload_path)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    size_bytes = models.PositiveBigIntegerField()
    status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.UPLOADED,
    )
    description = models.TextField(blank=True)
    source_date = models.DateField(null=True, blank=True)
    analysis_handoff = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "document_type"]),
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["owner", "is_deleted"]),
        ]

    def __str__(self) -> str:
        return self.title


class DocumentAuditEvent(models.Model):
    document = models.ForeignKey(
        MedicalDocument,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=80)
    summary = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} document {self.document_id}"
