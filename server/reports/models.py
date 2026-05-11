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
