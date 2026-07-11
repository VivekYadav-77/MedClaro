from django.conf import settings
from django.db import models

from documents.models import MedicalDocument


class ReportAnalysis(models.Model):
    class ProcessingStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        NEEDS_REVIEW = "needs_review", "Needs review"

    class HealthStatus(models.TextChoices):
        GOOD = "good", "Good"
        NEEDS_ATTENTION = "needs_attention", "Needs Attention"
        CRITICAL = "critical", "Critical"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="report_analyses",
    )
    document = models.ForeignKey(
        MedicalDocument,
        on_delete=models.CASCADE,
        related_name="report_analyses",
    )
    status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.REQUESTED,
    )
    health_score = models.PositiveSmallIntegerField(default=0)
    health_status = models.CharField(
        max_length=32,
        choices=HealthStatus.choices,
        default=HealthStatus.GOOD,
    )
    key_findings = models.JSONField(default=list, blank=True)
    food_guidance = models.JSONField(default=list, blank=True)
    lifestyle_guidance = models.JSONField(default=list, blank=True)
    doctor_prompts = models.JSONField(default=list, blank=True)
    disclaimer = models.TextField(blank=True)
    safety_review_required = models.BooleanField(default=False)
    safety_review_notes = models.JSONField(default=list, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="report-analysis-v1")
    source_document_reference = models.CharField(max_length=255, blank=True)
    analysis_payload = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["owner", "health_status"]),
            models.Index(fields=["document", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Report analysis {self.id} for document {self.document_id}"


class BiomarkerResult(models.Model):
    class MarkerStatus(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"
        UNKNOWN = "unknown", "Unknown"

    analysis = models.ForeignKey(
        ReportAnalysis,
        on_delete=models.CASCADE,
        related_name="biomarkers",
    )
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=80, blank=True)
    value = models.CharField(max_length=80)
    unit = models.CharField(max_length=40, blank=True)
    normal_range = models.CharField(max_length=120, blank=True)
    status = models.CharField(
        max_length=32,
        choices=MarkerStatus.choices,
        default=MarkerStatus.UNKNOWN,
    )
    severity = models.PositiveSmallIntegerField(default=0)
    summary = models.CharField(max_length=255, blank=True)
    explanations = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["analysis", "status"]),
            models.Index(fields=["analysis", "severity"]),
        ]

    def __str__(self) -> str:
        return f"{self.name}: {self.value} {self.unit}".strip()
