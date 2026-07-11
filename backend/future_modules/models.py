from django.conf import settings
from django.db import models


class FutureModuleRoadmap(models.Model):
    class ModuleKey(models.TextChoices):
        VACCINATION = "vaccination", "Vaccination tracker"
        WOMENS_HEALTH = "womens_health", "Women's health"
        CHILD_GROWTH = "child_growth", "Child growth"
        INSURANCE = "insurance", "Insurance folder"
        VAULT_EXPANSION = "vault_expansion", "Medical Vault expansion"
        SECOND_OPINION = "second_opinion", "Second Opinion AI"
        EDUCATION = "education", "Health education"
        WEARABLES = "wearables", "Wearable integration"
        HOSPITALS = "hospitals", "Hospital connectivity"
        PHARMACY = "pharmacy", "Pharmacy integration"
        APPOINTMENTS = "appointments", "Appointment management"
        NUTRITION = "nutrition", "Nutrition planning"
        FITNESS = "fitness", "Fitness recommendations"
        MENTAL_WELLNESS = "mental_wellness", "Mental wellness"
        PREVENTIVE = "preventive", "Preventive healthcare"

    class Priority(models.TextChoices):
        NOW = "now", "Now"
        NEXT = "next", "Next"
        LATER = "later", "Later"

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        DESIGN_READY = "design_ready", "Design ready"
        BLOCKED = "blocked", "Blocked"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="future_module_roadmap",
    )
    module_key = models.CharField(max_length=40, choices=ModuleKey.choices)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.LATER)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PLANNED)
    user_value = models.TextField()
    dependencies = models.JSONField(default=list, blank=True)
    profile_connections = models.JSONField(default=list, blank=True)
    timeline_event_types = models.JSONField(default=list, blank=True)
    release_notes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority", "module_key"]
        constraints = [
            models.UniqueConstraint(fields=["owner", "module_key"], name="unique_owner_future_module")
        ]

    def __str__(self) -> str:
        return f"{self.module_key}: {self.priority}"


class VaccinationRecord(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vaccination_records",
    )
    vaccine_name = models.CharField(max_length=160)
    dose_label = models.CharField(max_length=80, blank=True)
    administered_on = models.DateField(null=True, blank=True)
    next_due_on = models.DateField(null=True, blank=True)
    provider = models.CharField(max_length=160, blank=True)
    document_id = models.PositiveBigIntegerField(null=True, blank=True)
    reminder_enabled = models.BooleanField(default=True)
    reminder_rules = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["next_due_on", "-administered_on", "vaccine_name"]
        indexes = [models.Index(fields=["owner", "next_due_on"])]

    def __str__(self) -> str:
        return self.vaccine_name


class WomensHealthRecord(models.Model):
    class RecordType(models.TextChoices):
        PERIOD = "period", "Period"
        PREGNANCY = "pregnancy", "Pregnancy"
        PCOS = "pcos", "PCOS"
        MENOPAUSE = "menopause", "Menopause"
        IRON = "iron", "Iron"
        CALCIUM = "calcium", "Calcium"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="womens_health_records",
    )
    record_type = models.CharField(max_length=32, choices=RecordType.choices)
    record_date = models.DateField()
    cycle_day = models.PositiveSmallIntegerField(null=True, blank=True)
    symptoms = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    doctor_discussion_points = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-record_date", "-created_at"]
        indexes = [models.Index(fields=["owner", "record_type"])]

    def __str__(self) -> str:
        return f"{self.record_type} on {self.record_date}"


class ChildGrowthProfile(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="child_growth_profiles",
    )
    child_name = models.CharField(max_length=120)
    date_of_birth = models.DateField()
    sex = models.CharField(max_length=40, blank=True)
    blood_group = models.CharField(max_length=8, blank=True)
    pediatrician = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["child_name"]

    def __str__(self) -> str:
        return self.child_name


class ChildGrowthMeasurement(models.Model):
    child = models.ForeignKey(
        ChildGrowthProfile,
        on_delete=models.CASCADE,
        related_name="measurements",
    )
    measured_on = models.DateField()
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    head_circumference_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentile_notes = models.JSONField(default=list, blank=True)
    doctor_prompts = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-measured_on", "-created_at"]
        indexes = [models.Index(fields=["child", "measured_on"])]

    def __str__(self) -> str:
        return f"Growth measurement {self.measured_on}"


class InsurancePolicy(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="insurance_policies",
    )
    provider_name = models.CharField(max_length=160)
    policy_number = models.CharField(max_length=120)
    coverage_type = models.CharField(max_length=120, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    emergency_claim_phone = models.CharField(max_length=80, blank=True)
    document_ids = models.JSONField(default=list, blank=True)
    coverage_summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["provider_name"]
        indexes = [models.Index(fields=["owner", "provider_name"])]

    def __str__(self) -> str:
        return self.provider_name


class SecondOpinionRequest(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        READY_FOR_DOCTOR = "ready_for_doctor", "Ready for doctor"
        NEEDS_MORE_INFO = "needs_more_info", "Needs more information"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="second_opinion_requests",
    )
    concern = models.TextField()
    related_document_ids = models.JSONField(default=list, blank=True)
    related_timeline_event_ids = models.JSONField(default=list, blank=True)
    discussion_points = models.JSONField(default=list, blank=True)
    questions_to_ask = models.JSONField(default=list, blank=True)
    relevant_findings = models.JSONField(default=list, blank=True)
    missing_tests_to_discuss = models.JSONField(default=list, blank=True)
    safety_language = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    model_name = models.CharField(max_length=120, default="gemini-3.1-flash-lite")
    prompt_version = models.CharField(max_length=40, default="second-opinion-safety-v1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["owner", "status"])]

    def __str__(self) -> str:
        return f"Second opinion {self.id}"


class HealthEducationContent(models.Model):
    class ContentType(models.TextChoices):
        BIOMARKER = "biomarker", "Biomarker"
        CONDITION = "condition", "Condition"
        FOOD = "food", "Food"
        EXERCISE = "exercise", "Exercise"
        VIDEO = "video", "Video"
        ARTICLE = "article", "Article"

    title = models.CharField(max_length=180)
    content_type = models.CharField(max_length=32, choices=ContentType.choices)
    audience = models.CharField(max_length=80, default="general")
    summary = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    related_profile_fields = models.JSONField(default=list, blank=True)
    medical_review_status = models.CharField(max_length=80, default="planned_review")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["content_type", "title"]

    def __str__(self) -> str:
        return self.title


class WearableIntegrationPlan(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wearable_integration_plans",
    )
    provider = models.CharField(max_length=120)
    metrics = models.JSONField(default=list, blank=True)
    sync_frequency = models.CharField(max_length=80, default="daily")
    consent_scopes = models.JSONField(default=list, blank=True)
    last_sync_status = models.CharField(max_length=80, default="planned")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["provider"]

    def __str__(self) -> str:
        return self.provider


class PartnerIntegrationBoundary(models.Model):
    class PartnerType(models.TextChoices):
        HOSPITAL = "hospital", "Hospital"
        PHARMACY = "pharmacy", "Pharmacy"
        APPOINTMENT = "appointment", "Appointment"
        INSURANCE = "insurance", "Insurance"

    partner_type = models.CharField(max_length=32, choices=PartnerType.choices, unique=True)
    inbound_data = models.JSONField(default=list, blank=True)
    outbound_data = models.JSONField(default=list, blank=True)
    consent_required = models.BooleanField(default=True)
    permission_boundary = models.TextField()
    audit_events = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=80, default="planned_partner_dependency")

    class Meta:
        ordering = ["partner_type"]

    def __str__(self) -> str:
        return self.partner_type
