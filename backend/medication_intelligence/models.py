from django.conf import settings
from django.db import models

from documents.models import MedicalDocument


class PrescriptionAnalysis(models.Model):
    class ProcessingStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        NEEDS_REVIEW = "needs_review", "Needs review"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prescription_analyses",
    )
    document = models.ForeignKey(
        MedicalDocument,
        on_delete=models.CASCADE,
        related_name="prescription_analyses",
    )
    status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.REQUESTED,
    )
    prescribed_by = models.CharField(max_length=160, blank=True)
    prescription_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    summary = models.TextField(blank=True)
    warnings = models.JSONField(default=list, blank=True)
    safety_review_required = models.BooleanField(default=False)
    safety_review_notes = models.JSONField(default=list, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="prescription-analysis-v1")
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
            models.Index(fields=["owner", "is_expired"]),
            models.Index(fields=["document", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Prescription analysis {self.id} for document {self.document_id}"


class Medication(models.Model):
    class Route(models.TextChoices):
        ORAL = "oral", "Oral"
        TOPICAL = "topical", "Topical"
        INJECTION = "injection", "Injection"
        INHALATION = "inhalation", "Inhalation"
        OTHER = "other", "Other"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medications",
    )
    analysis = models.ForeignKey(
        PrescriptionAnalysis,
        on_delete=models.CASCADE,
        related_name="medications",
    )
    brand_name = models.CharField(max_length=160)
    active_ingredient = models.CharField(max_length=160)
    strength = models.CharField(max_length=80, blank=True)
    route = models.CharField(max_length=32, choices=Route.choices, default=Route.ORAL)
    purpose = models.CharField(max_length=240, blank=True)
    usage_guidance = models.TextField(blank=True)
    side_effects = models.JSONField(default=list, blank=True)
    food_warnings = models.JSONField(default=list, blank=True)
    alcohol_warning = models.CharField(max_length=240, blank=True)
    driving_warning = models.CharField(max_length=240, blank=True)
    pregnancy_breastfeeding_note = models.TextField(blank=True)
    duplicate_key = models.CharField(max_length=180, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "brand_name"]
        indexes = [
            models.Index(fields=["owner", "active_ingredient"]),
            models.Index(fields=["analysis", "duplicate_key"]),
        ]

    def __str__(self) -> str:
        return self.brand_name


class MedicationSchedule(models.Model):
    class ReminderStatus(models.TextChoices):
        PLANNED = "planned", "Planned"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"

    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    dosage = models.CharField(max_length=120)
    frequency = models.CharField(max_length=160)
    timing = models.JSONField(default=list, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    reminder_status = models.CharField(
        max_length=32,
        choices=ReminderStatus.choices,
        default=ReminderStatus.PLANNED,
    )
    notification_plan = models.JSONField(default=dict, blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["medication__sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.medication.brand_name}: {self.frequency}"


class MedicationWarning(models.Model):
    class WarningType(models.TextChoices):
        ALLERGY = "allergy", "Allergy"
        INTERACTION = "interaction", "Interaction"
        DUPLICATE = "duplicate", "Duplicate"
        EXPIRED = "expired", "Expired"
        FOOD = "food", "Food"
        ALCOHOL = "alcohol", "Alcohol"
        DRIVING = "driving", "Driving"
        PREGNANCY = "pregnancy", "Pregnancy"
        GENERAL = "general", "General"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        LOW = "low", "Low"
        MODERATE = "moderate", "Moderate"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    analysis = models.ForeignKey(
        PrescriptionAnalysis,
        on_delete=models.CASCADE,
        related_name="medication_warnings",
    )
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="warnings",
    )
    warning_type = models.CharField(max_length=32, choices=WarningType.choices)
    severity = models.CharField(
        max_length=32,
        choices=Severity.choices,
        default=Severity.INFO,
    )
    title = models.CharField(max_length=180)
    message = models.TextField()
    action_prompt = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["analysis", "severity"]),
            models.Index(fields=["analysis", "warning_type"]),
        ]

    def __str__(self) -> str:
        return self.title

# Create your models here.
