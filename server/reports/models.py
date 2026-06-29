import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from projecthealth_backend.choices import LANGUAGE_CHOICES, REPORT_TYPE_CHOICES


class Report(models.Model):
    ANALYSIS_STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("extracting", "Extracting"),
        ("analyzing", "Analyzing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("fallback_used", "Fallback used"),
    ]

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
    original_filename = models.CharField(max_length=255, blank=True, default="")
    analysis_status = models.CharField(max_length=30, choices=ANALYSIS_STATUS_CHOICES, default="completed")
    analysis_metadata = models.JSONField(default=dict)

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


class PrescriptionRecord(models.Model):
    STATUS_CHOICES = [
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("stopped", "Stopped"),
        ("short_course", "Short course"),
        ("unknown", "Unknown"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="prescription_records", on_delete=models.CASCADE)
    report = models.OneToOneField(Report, related_name="prescription_record", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unknown")
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    doctor_name = models.CharField(max_length=120, blank=True, default="")
    specialty = models.CharField(max_length=80, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    medications_snapshot = models.JSONField(default=list)
    prescription_context = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]


class PrescriptionReportLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(PrescriptionRecord, related_name="report_links", on_delete=models.CASCADE)
    report = models.ForeignKey(Report, related_name="prescription_links", on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("prescription", "report")
        ordering = ["-created_at"]


class PrescriptionContextualAnalysis(models.Model):
    CONFIDENCE_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="prescription_contextual_analyses", on_delete=models.CASCADE)
    prescription = models.ForeignKey(PrescriptionRecord, related_name="contextual_analyses", on_delete=models.CASCADE)
    selected_report_ids = models.JSONField(default=list)
    context_snapshot = models.JSONField(default=dict)
    result = models.JSONField(default=dict)
    confidence = models.CharField(max_length=20, choices=CONFIDENCE_CHOICES, default="low")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]


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


class GlobalChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="global_chat_sessions", on_delete=models.CASCADE)
    circle = models.ForeignKey("circles.Circle", related_name="global_chat_sessions", on_delete=models.SET_NULL, blank=True, null=True)
    title = models.CharField(max_length=120, blank=True, default="Health assistant")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]


class GlobalChatMessage(models.Model):
    session = models.ForeignKey(GlobalChatSession, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=20)
    content = models.TextField()
    health_context_snapshot = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at", "id"]


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="audit_events", on_delete=models.CASCADE, blank=True, null=True)
    event_type = models.CharField(max_length=80)
    object_type = models.CharField(max_length=80, blank=True, default="")
    object_id = models.CharField(max_length=80, blank=True, default="")
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


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


class ScreeningSchedule(models.Model):
    STATUS_CHOICES = [
        ("due", "Due"),
        ("upcoming", "Upcoming"),
        ("done", "Done"),
        ("deferred", "Deferred"),
        ("not_applicable", "Not applicable"),
        ("needs_profile", "Needs profile"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="screening_schedules", on_delete=models.CASCADE)
    title = models.CharField(max_length=120)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="upcoming")
    due_date = models.DateTimeField(blank=True, null=True)
    reason = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "title")
        ordering = ["status", "due_date", "title"]


class DischargePlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="discharge_plans", on_delete=models.CASCADE)
    circle = models.ForeignKey("circles.Circle", related_name="discharge_plans", on_delete=models.SET_NULL, blank=True, null=True)
    source_name = models.CharField(max_length=255, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    review_message = models.TextField(default="Review each item against the original discharge summary before acting.")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]


class DischargeTask(models.Model):
    STATUS_CHOICES = [("open", "Open"), ("done", "Done"), ("deferred", "Deferred")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(DischargePlan, related_name="tasks", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    detail = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    due_date = models.DateTimeField(blank=True, null=True)
    assignee_name = models.CharField(max_length=120, blank=True, default="")
    source = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["status", "due_date", "created_at"]


class RemissionPathway(models.Model):
    CONDITION_CHOICES = [
        ("prediabetes", "Prediabetes"),
        ("fatty_liver", "Fatty liver"),
        ("hypertension", "Hypertension"),
        ("general", "General"),
    ]
    STATUS_CHOICES = [("active", "Active"), ("completed", "Completed"), ("paused", "Paused")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="remission_pathways", on_delete=models.CASCADE)
    condition = models.CharField(max_length=40, choices=CONDITION_CHOICES)
    title = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    start_date = models.DateTimeField(default=timezone.now)
    current_week = models.PositiveIntegerField(default=1)
    progress_percent = models.PositiveIntegerField(default=8)
    next_habit = models.CharField(max_length=255, blank=True, default="")
    weekly_habits = models.JSONField(default=list)
    marker_goals = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "condition")
        ordering = ["status", "condition"]


class PathwayLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pathway = models.ForeignKey(RemissionPathway, related_name="logs", on_delete=models.CASCADE)
    note = models.CharField(max_length=240)
    logged_at = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict)

    class Meta:
        ordering = ["-logged_at", "-id"]
