from rest_framework import serializers

from .models import (
    ChildGrowthMeasurement,
    ChildGrowthProfile,
    FutureModuleRoadmap,
    HealthEducationContent,
    InsurancePolicy,
    PartnerIntegrationBoundary,
    SecondOpinionRequest,
    VaccinationRecord,
    WearableIntegrationPlan,
    WomensHealthRecord,
)
from .services import create_second_opinion, vaccination_reminder_rules


class FutureModuleRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = FutureModuleRoadmap
        fields = [
            "id",
            "module_key",
            "priority",
            "status",
            "user_value",
            "dependencies",
            "profile_connections",
            "timeline_event_types",
            "release_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VaccinationRecordSerializer(serializers.ModelSerializer):
    reminder_rules = serializers.JSONField(read_only=True)

    class Meta:
        model = VaccinationRecord
        fields = [
            "id",
            "vaccine_name",
            "dose_label",
            "administered_on",
            "next_due_on",
            "provider",
            "document_id",
            "reminder_enabled",
            "reminder_rules",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "reminder_rules", "created_at"]

    def create(self, validated_data):
        record = VaccinationRecord(owner=self.context["request"].user, **validated_data)
        record.reminder_rules = vaccination_reminder_rules(record)
        record.save()
        return record


class WomensHealthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WomensHealthRecord
        fields = [
            "id",
            "record_type",
            "record_date",
            "cycle_day",
            "symptoms",
            "metrics",
            "doctor_discussion_points",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault(
            "doctor_discussion_points",
            ["Discuss recurring patterns, severe symptoms, pregnancy context, or abnormal iron/calcium markers with a clinician."],
        )
        return WomensHealthRecord.objects.create(owner=self.context["request"].user, **validated_data)


class ChildGrowthMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildGrowthMeasurement
        fields = [
            "id",
            "measured_on",
            "height_cm",
            "weight_kg",
            "head_circumference_cm",
            "percentile_notes",
            "doctor_prompts",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ChildGrowthProfileSerializer(serializers.ModelSerializer):
    measurements = ChildGrowthMeasurementSerializer(many=True, read_only=True)

    class Meta:
        model = ChildGrowthProfile
        fields = [
            "id",
            "child_name",
            "date_of_birth",
            "sex",
            "blood_group",
            "pediatrician",
            "notes",
            "measurements",
            "created_at",
        ]
        read_only_fields = ["id", "measurements", "created_at"]

    def create(self, validated_data):
        return ChildGrowthProfile.objects.create(owner=self.context["request"].user, **validated_data)


class InsurancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePolicy
        fields = [
            "id",
            "provider_name",
            "policy_number",
            "coverage_type",
            "valid_from",
            "valid_until",
            "emergency_claim_phone",
            "document_ids",
            "coverage_summary",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        return InsurancePolicy.objects.create(owner=self.context["request"].user, **validated_data)


class SecondOpinionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecondOpinionRequest
        fields = [
            "id",
            "concern",
            "related_document_ids",
            "related_timeline_event_ids",
            "discussion_points",
            "questions_to_ask",
            "relevant_findings",
            "missing_tests_to_discuss",
            "safety_language",
            "status",
            "model_name",
            "prompt_version",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "discussion_points",
            "questions_to_ask",
            "relevant_findings",
            "missing_tests_to_discuss",
            "safety_language",
            "status",
            "model_name",
            "prompt_version",
            "created_at",
        ]

    def create(self, validated_data):
        return create_second_opinion(self.context["request"].user, validated_data)


class HealthEducationContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthEducationContent
        fields = [
            "id",
            "title",
            "content_type",
            "audience",
            "summary",
            "tags",
            "related_profile_fields",
            "medical_review_status",
            "created_at",
        ]


class WearableIntegrationPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = WearableIntegrationPlan
        fields = [
            "id",
            "provider",
            "metrics",
            "sync_frequency",
            "consent_scopes",
            "last_sync_status",
            "created_at",
        ]
        read_only_fields = ["id", "last_sync_status", "created_at"]

    def create(self, validated_data):
        return WearableIntegrationPlan.objects.create(owner=self.context["request"].user, **validated_data)


class PartnerIntegrationBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerIntegrationBoundary
        fields = [
            "id",
            "partner_type",
            "inbound_data",
            "outbound_data",
            "consent_required",
            "permission_boundary",
            "audit_events",
            "status",
        ]
