from django.conf import settings
from django.db import models

from report_analysis.models import ReportAnalysis


class TimelineEvent(models.Model):
    class EventType(models.TextChoices):
        REPORT = "report", "Report"
        PRESCRIPTION = "prescription", "Prescription"
        SYMPTOM = "symptom", "Symptom"
        MEDICINE = "medicine", "Medicine"
        DOCTOR_SUMMARY = "doctor_summary", "Doctor summary"
        JOURNAL = "journal", "Journal"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timeline_events",
    )
    event_type = models.CharField(max_length=32, choices=EventType.choices)
    title = models.CharField(max_length=180)
    summary = models.TextField(blank=True)
    event_date = models.DateField()
    report_analysis = models.ForeignKey(
        ReportAnalysis,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="timeline_events",
    )
    source_type = models.CharField(max_length=80, blank=True)
    source_id = models.PositiveBigIntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-event_date", "-created_at"]
        indexes = [
            models.Index(fields=["owner", "event_date"]),
            models.Index(fields=["owner", "event_type"]),
            models.Index(fields=["owner", "source_type", "source_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "source_type", "source_id", "event_type"],
                name="unique_timeline_event_source",
            )
        ]

    def __str__(self) -> str:
        return f"{self.event_type}: {self.title}"


class TrendInsight(models.Model):
    class TrendLabel(models.TextChoices):
        IMPROVING = "improving", "Improving"
        WORSENING = "worsening", "Worsening"
        STABLE = "stable", "Stable"
        FLUCTUATING = "fluctuating", "Fluctuating"
        INSUFFICIENT_DATA = "insufficient_data", "Insufficient Data"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trend_insights",
    )
    biomarker_name = models.CharField(max_length=160)
    biomarker_code = models.CharField(max_length=80, blank=True)
    unit = models.CharField(max_length=40, blank=True)
    label = models.CharField(
        max_length=32,
        choices=TrendLabel.choices,
        default=TrendLabel.INSUFFICIENT_DATA,
    )
    report_count = models.PositiveSmallIntegerField(default=0)
    first_value = models.FloatField(null=True, blank=True)
    latest_value = models.FloatField(null=True, blank=True)
    delta = models.FloatField(null=True, blank=True)
    graph_points = models.JSONField(default=list, blank=True)
    risk_awareness = models.JSONField(default=list, blank=True)
    doctor_prompts = models.JSONField(default=list, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="trend-analysis-v1")
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["biomarker_name"]
        indexes = [
            models.Index(fields=["owner", "label"]),
            models.Index(fields=["owner", "biomarker_code"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "biomarker_name", "biomarker_code"],
                name="unique_owner_biomarker_trend",
            )
        ]

    def __str__(self) -> str:
        return f"{self.biomarker_name}: {self.label}"

# Create your models here.
