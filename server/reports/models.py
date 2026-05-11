import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from projecthealth_backend.choices import LANGUAGE_CHOICES, REPORT_TYPE_CHOICES


class Report(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reports", on_delete=models.CASCADE)
    family_member = models.ForeignKey("users.FamilyMember", related_name="reports", on_delete=models.CASCADE, blank=True, null=True)
    report_type = models.CharField(max_length=40, choices=REPORT_TYPE_CHOICES, default="unknown")
    report_date = models.DateTimeField(blank=True, null=True)
    upload_date = models.DateTimeField(default=timezone.now)
    lab_name = models.CharField(max_length=255, blank=True, null=True)
    file_ref = models.CharField(max_length=512)
    structured_data_encrypted = models.JSONField(default=dict)
    ai_explanation = models.JSONField(default=dict)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    medications = models.JSONField(default=list)

    class Meta:
        ordering = ["-upload_date"]


class ReportShare(models.Model):
    ACCESS_CHOICES = [("view", "View")]
    STATUS_CHOICES = [("active", "Active"), ("revoked", "Revoked")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, related_name="shares", on_delete=models.CASCADE)
    circle = models.ForeignKey("circles.Circle", related_name="report_shares", on_delete=models.CASCADE)
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="report_shares_created", on_delete=models.CASCADE)
    consent_granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="report_share_consents",
        on_delete=models.CASCADE,
    )
    access_level = models.CharField(max_length=20, choices=ACCESS_CHOICES, default="view")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(default=timezone.now)
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ("report", "circle")
        ordering = ["-created_at"]


class StructuredParameter(models.Model):
    report = models.ForeignKey(Report, related_name="structured_parameters", on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)
    test_name = models.CharField(max_length=255)
    numeric_value = models.FloatField(blank=True, null=True)
    raw_value_text = models.CharField(max_length=255, blank=True, default="")
    unit = models.CharField(max_length=50, blank=True, default="")
    normalized_value = models.FloatField(blank=True, null=True)
    normalized_unit = models.CharField(max_length=50, blank=True, null=True)
    reference_range_low = models.FloatField(blank=True, null=True)
    reference_range_high = models.FloatField(blank=True, null=True)
    flag = models.CharField(max_length=20, default="normal")

    class Meta:
        ordering = ["position", "id"]


class ChatMessage(models.Model):
    report = models.ForeignKey(Report, related_name="chat_messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=20)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["timestamp", "id"]


class RateLimitEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="rate_limits", on_delete=models.CASCADE)
    action = models.CharField(max_length=80)
    window_start = models.DateTimeField()
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()

    class Meta:
        unique_together = ("user", "action", "window_start")


class AnalysisQueueEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="analysis_queue_entries", on_delete=models.CASCADE)
    reason = models.CharField(max_length=80)
    status = models.CharField(max_length=30, default="pending")
    created_at = models.DateTimeField(default=timezone.now)


class EmergencyEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="emergency_events", on_delete=models.CASCADE)
    circle = models.ForeignKey("circles.Circle", related_name="emergency_events", on_delete=models.SET_NULL, blank=True, null=True)
    latest_report = models.ForeignKey(Report, related_name="emergency_events", on_delete=models.SET_NULL, blank=True, null=True)
    report_context = models.JSONField(default=dict)
    location_payload = models.JSONField(default=dict)
    summary_text = models.TextField()
    recipient_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class EmergencyCardAccess(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(EmergencyEvent, related_name="access_logs", on_delete=models.CASCADE)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="emergency_card_accesses", on_delete=models.CASCADE)
    report = models.ForeignKey(Report, related_name="emergency_card_accesses", on_delete=models.SET_NULL, blank=True, null=True)
    family_member = models.ForeignKey("users.FamilyMember", related_name="emergency_card_accesses", on_delete=models.SET_NULL, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=512, blank=True, default="")
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class WearableMetric(models.Model):
    METRIC_CHOICES = [
        ("steps", "Steps"),
        ("sleep_minutes", "Sleep minutes"),
        ("resting_heart_rate", "Resting heart rate"),
        ("blood_pressure_systolic", "Blood pressure systolic"),
        ("blood_pressure_diastolic", "Blood pressure diastolic"),
        ("glucose", "Glucose"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="wearable_metrics", on_delete=models.CASCADE)
    metric_type = models.CharField(max_length=40, choices=METRIC_CHOICES)
    value = models.FloatField()
    unit = models.CharField(max_length=40, blank=True, default="")
    recorded_at = models.DateTimeField()
    source = models.CharField(max_length=80, blank=True, default="manual_import")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-recorded_at", "-created_at"]
