from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SymptomLog(models.Model):
    class Severity(models.TextChoices):
        MILD = "mild", "Mild"
        MODERATE = "moderate", "Moderate"
        SEVERE = "severe", "Severe"
        CRITICAL = "critical", "Critical"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="symptom_logs",
    )
    symptom = models.CharField(max_length=160)
    severity = models.CharField(
        max_length=32,
        choices=Severity.choices,
        default=Severity.MILD,
    )
    pain_level = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    triggers = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    doctor_consultation_recommended = models.BooleanField(default=False)
    safety_notes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["owner", "started_at"]),
            models.Index(fields=["owner", "severity"]),
            models.Index(fields=["owner", "symptom"]),
        ]

    def __str__(self) -> str:
        return f"{self.symptom} ({self.severity})"


class JournalEntry(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="journal_entries",
    )
    entry_date = models.DateField()
    title = models.CharField(max_length=180, blank=True)
    notes = models.TextField(blank=True)
    mood = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(10)])
    stress = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(10)])
    sleep_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    energy = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(10)])
    pain = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    fever_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    systolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    diastolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    blood_sugar_mg_dl = models.PositiveSmallIntegerField(null=True, blank=True)
    pulse_bpm = models.PositiveSmallIntegerField(null=True, blank=True)
    water_ml = models.PositiveSmallIntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-entry_date", "-created_at"]
        indexes = [
            models.Index(fields=["owner", "entry_date"]),
            models.Index(fields=["owner", "mood"]),
            models.Index(fields=["owner", "stress"]),
        ]

    def __str__(self) -> str:
        return self.title or f"Journal {self.entry_date}"


class LifestylePlan(models.Model):
    class PlanType(models.TextChoices):
        DIET = "diet", "Diet"
        EXERCISE = "exercise", "Exercise"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lifestyle_plans",
    )
    plan_type = models.CharField(max_length=32, choices=PlanType.choices)
    title = models.CharField(max_length=180)
    summary = models.TextField(blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    restrictions = models.JSONField(default=list, blank=True)
    doctor_consultation_prompts = models.JSONField(default=list, blank=True)
    safety_notes = models.JSONField(default=list, blank=True)
    input_context = models.JSONField(default=dict, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="lifestyle-planner-v1")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]
        indexes = [
            models.Index(fields=["owner", "plan_type"]),
            models.Index(fields=["owner", "generated_at"]),
        ]

    def __str__(self) -> str:
        return self.title
