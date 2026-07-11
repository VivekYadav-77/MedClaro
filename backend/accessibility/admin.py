from django.contrib import admin

from .models import AccessibilityPreference, LocalizedContentArtifact, VoiceSummaryArtifact


@admin.register(AccessibilityPreference)
class AccessibilityPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "preferred_language", "senior_mode", "large_text", "voice_summaries"]
    list_filter = ["preferred_language", "senior_mode", "large_text", "high_contrast"]
    search_fields = ["user__username", "user__email"]


@admin.register(LocalizedContentArtifact)
class LocalizedContentArtifactAdmin(admin.ModelAdmin):
    list_display = ["source_type", "owner", "language", "literacy_level", "model_name", "created_at"]
    list_filter = ["source_type", "language", "literacy_level"]
    search_fields = ["original_text", "localized_text", "owner__username"]


@admin.register(VoiceSummaryArtifact)
class VoiceSummaryArtifactAdmin(admin.ModelAdmin):
    list_display = ["voice_type", "owner", "language", "provider_status", "created_at"]
    list_filter = ["voice_type", "language", "provider_status"]
    search_fields = ["script_text", "owner__username"]

# Register your models here.
