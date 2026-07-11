from rest_framework import serializers

from documents.models import MedicalDocument

from .models import (
    Medication,
    MedicationSchedule,
    MedicationWarning,
    PrescriptionAnalysis,
)


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = [
            "id",
            "dosage",
            "frequency",
            "timing",
            "start_date",
            "end_date",
            "reminder_status",
            "notification_plan",
            "instructions",
        ]
        read_only_fields = fields


class MedicationWarningSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.brand_name", read_only=True)

    class Meta:
        model = MedicationWarning
        fields = [
            "id",
            "medication",
            "medication_name",
            "warning_type",
            "severity",
            "title",
            "message",
            "action_prompt",
            "created_at",
        ]
        read_only_fields = fields


class MedicationSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, read_only=True)
    warnings = MedicationWarningSerializer(many=True, read_only=True)

    class Meta:
        model = Medication
        fields = [
            "id",
            "brand_name",
            "active_ingredient",
            "strength",
            "route",
            "purpose",
            "usage_guidance",
            "side_effects",
            "food_warnings",
            "alcohol_warning",
            "driving_warning",
            "pregnancy_breastfeeding_note",
            "duplicate_key",
            "sort_order",
            "schedules",
            "warnings",
        ]
        read_only_fields = fields


class PrescriptionAnalysisSerializer(serializers.ModelSerializer):
    medications = MedicationSerializer(many=True, read_only=True)
    medication_warnings = MedicationWarningSerializer(many=True, read_only=True)
    document_title = serializers.CharField(source="document.title", read_only=True)

    class Meta:
        model = PrescriptionAnalysis
        fields = [
            "id",
            "document",
            "document_title",
            "status",
            "prescribed_by",
            "prescription_date",
            "expiry_date",
            "is_expired",
            "summary",
            "warnings",
            "safety_review_required",
            "safety_review_notes",
            "model_name",
            "prompt_version",
            "source_document_reference",
            "analysis_payload",
            "failure_reason",
            "completed_at",
            "created_at",
            "updated_at",
            "medications",
            "medication_warnings",
        ]
        read_only_fields = fields


class PrescriptionAnalysisCreateSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()

    def validate_document_id(self, value):
        request = self.context["request"]
        try:
            document = MedicalDocument.objects.get(
                id=value,
                owner=request.user,
                is_deleted=False,
            )
        except MedicalDocument.DoesNotExist as exc:
            raise serializers.ValidationError("Document not found.") from exc

        if document.document_type != MedicalDocument.DocumentType.PRESCRIPTION:
            raise serializers.ValidationError("Only prescription documents can be analyzed here.")

        self.context["document"] = document
        return value

    def create(self, validated_data):
        from .services import run_prescription_analysis

        return run_prescription_analysis(
            document=self.context["document"],
            owner=self.context["request"].user,
        )
