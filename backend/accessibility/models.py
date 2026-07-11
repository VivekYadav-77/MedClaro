from django.conf import settings
from django.db import models


class AccessibilityPreference(models.Model):
    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        HINDI = "hi", "Hindi"
        BENGALI = "bn", "Bengali"
        TAMIL = "ta", "Tamil"
        TELUGU = "te", "Telugu"
        MARATHI = "mr", "Marathi"
        GUJARATI = "gu", "Gujarati"
        KANNADA = "kn", "Kannada"
        MALAYALAM = "ml", "Malayalam"
        PUNJABI = "pa", "Punjabi"
        URDU = "ur", "Urdu"

    class TextSize(models.TextChoices):
        STANDARD = "standard", "Standard"
        LARGE = "large", "Large"
        EXTRA_LARGE = "extra_large", "Extra large"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="accessibility_preference",
    )
    preferred_language = models.CharField(
        max_length=16,
        choices=Language.choices,
        default=Language.ENGLISH,
    )
    fallback_language = models.CharField(
        max_length=16,
        choices=Language.choices,
        default=Language.ENGLISH,
    )
    senior_mode = models.BooleanField(default=False)
    simplified_dashboard = models.BooleanField(default=False)
    large_text = models.CharField(
        max_length=32,
        choices=TextSize.choices,
        default=TextSize.STANDARD,
    )
    high_contrast = models.BooleanField(default=False)
    reduce_motion = models.BooleanField(default=False)
    voice_summaries = models.BooleanField(default=False)
    read_aloud_reports = models.BooleanField(default=False)
    assistant_voice_input = models.BooleanField(default=False)
    one_click_actions = models.JSONField(default=list, blank=True)
    localization_notes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user_id"]

    def __str__(self) -> str:
        return f"Accessibility preferences for {self.user_id}"


class LocalizedContentArtifact(models.Model):
    class SourceType(models.TextChoices):
        REPORT = "report", "Report"
        PRESCRIPTION = "prescription", "Prescription"
        ASSISTANT = "assistant", "Assistant"
        DOCTOR_SUMMARY = "doctor_summary", "Doctor summary"
        LIFESTYLE_PLAN = "lifestyle_plan", "Lifestyle plan"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="localized_content_artifacts",
    )
    source_type = models.CharField(max_length=40, choices=SourceType.choices)
    source_id = models.PositiveBigIntegerField(null=True, blank=True)
    language = models.CharField(max_length=16, choices=AccessibilityPreference.Language.choices)
    fallback_language = models.CharField(
        max_length=16,
        choices=AccessibilityPreference.Language.choices,
        default=AccessibilityPreference.Language.ENGLISH,
    )
    original_text = models.TextField()
    localized_text = models.TextField()
    literacy_level = models.CharField(max_length=80, default="simple")
    quality_checks = models.JSONField(default=list, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="multilingual-accessibility-v1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "source_type"]),
            models.Index(fields=["owner", "language"]),
        ]

    def __str__(self) -> str:
        return f"{self.source_type} in {self.language}"


class VoiceSummaryArtifact(models.Model):
    class VoiceType(models.TextChoices):
        REPORT_READ_ALOUD = "report_read_aloud", "Report read aloud"
        ASSISTANT_RESPONSE = "assistant_response", "Assistant response"
        DOCTOR_SUMMARY = "doctor_summary", "Doctor summary"
        EMERGENCY_PROFILE = "emergency_profile", "Emergency profile"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="voice_summary_artifacts",
    )
    voice_type = models.CharField(max_length=40, choices=VoiceType.choices)
    source_id = models.PositiveBigIntegerField(null=True, blank=True)
    language = models.CharField(max_length=16, choices=AccessibilityPreference.Language.choices)
    script_text = models.TextField()
    audio_url = models.URLField(blank=True)
    provider_status = models.CharField(max_length=80, default="planned")
    provider_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "voice_type"]),
            models.Index(fields=["owner", "language"]),
        ]

    def __str__(self) -> str:
        return f"{self.voice_type} voice summary"
