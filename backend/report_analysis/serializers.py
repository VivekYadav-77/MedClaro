from rest_framework import serializers

from documents.models import MedicalDocument

from .models import BiomarkerResult, ReportAnalysis


class BiomarkerResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiomarkerResult
        fields = [
            "id",
            "name",
            "code",
            "value",
            "unit",
            "normal_range",
            "status",
            "severity",
            "summary",
            "explanations",
            "recommendations",
            "sort_order",
        ]
        read_only_fields = fields


class ReportAnalysisSerializer(serializers.ModelSerializer):
    biomarkers = BiomarkerResultSerializer(many=True, read_only=True)
    document_title = serializers.CharField(source="document.title", read_only=True)

    class Meta:
        model = ReportAnalysis
        fields = [
            "id",
            "document",
            "document_title",
            "status",
            "health_score",
            "health_status",
            "key_findings",
            "food_guidance",
            "lifestyle_guidance",
            "doctor_prompts",
            "disclaimer",
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
            "biomarkers",
        ]
        read_only_fields = fields


class ReportAnalysisCreateSerializer(serializers.Serializer):
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

        if document.document_type != MedicalDocument.DocumentType.LAB_REPORT:
            raise serializers.ValidationError("Only lab report documents can be analyzed here.")

        self.context["document"] = document
        return value

    def create(self, validated_data):
        from .services import run_report_analysis

        return run_report_analysis(
            document=self.context["document"],
            owner=self.context["request"].user,
        )
