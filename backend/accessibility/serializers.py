from rest_framework import serializers

from .models import AccessibilityPreference, LocalizedContentArtifact, VoiceSummaryArtifact
from .services import create_localized_artifact, create_voice_summary


class AccessibilityPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessibilityPreference
        fields = [
            "id",
            "preferred_language",
            "fallback_language",
            "senior_mode",
            "simplified_dashboard",
            "large_text",
            "high_contrast",
            "reduce_motion",
            "voice_summaries",
            "read_aloud_reports",
            "assistant_voice_input",
            "one_click_actions",
            "localization_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LocalizedContentArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalizedContentArtifact
        fields = [
            "id",
            "source_type",
            "source_id",
            "language",
            "fallback_language",
            "original_text",
            "localized_text",
            "literacy_level",
            "quality_checks",
            "model_name",
            "prompt_version",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "fallback_language",
            "localized_text",
            "quality_checks",
            "model_name",
            "prompt_version",
            "created_at",
        ]

    def create(self, validated_data):
        return create_localized_artifact(self.context["request"].user, validated_data)


class VoiceSummaryArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceSummaryArtifact
        fields = [
            "id",
            "voice_type",
            "source_id",
            "language",
            "script_text",
            "audio_url",
            "provider_status",
            "provider_metadata",
            "created_at",
        ]
        read_only_fields = ["id", "audio_url", "provider_status", "provider_metadata", "created_at"]

    def create(self, validated_data):
        return create_voice_summary(self.context["request"].user, validated_data)
