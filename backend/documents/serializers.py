from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from .models import MedicalDocument


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class MedicalDocumentSerializer(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "title",
            "document_type",
            "file",
            "original_filename",
            "content_type",
            "size_bytes",
            "status",
            "description",
            "source_date",
            "analysis_handoff",
            "failure_reason",
            "preview_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "file",
            "original_filename",
            "content_type",
            "size_bytes",
            "status",
            "analysis_handoff",
            "failure_reason",
            "preview_url",
            "created_at",
            "updated_at",
        ]

    def get_preview_url(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(f"/api/v1/documents/{obj.id}/preview/")


class MedicalDocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "title",
            "document_type",
            "file",
            "description",
            "source_date",
        ]
        read_only_fields = ["id"]

    def validate_file(self, uploaded_file):
        extension = Path(uploaded_file.name).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Unsupported file type. Upload PDF, image, DOC, or DOCX files."
            )

        content_type = getattr(uploaded_file, "content_type", "")
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError("Unsupported file content type.")

        max_bytes = settings.MAX_UPLOAD_SIZE_BYTES
        if uploaded_file.size > max_bytes:
            max_mb = max_bytes // (1024 * 1024)
            raise serializers.ValidationError(f"File is too large. Maximum size is {max_mb} MB.")

        return uploaded_file

    def create(self, validated_data):
        uploaded_file = validated_data["file"]
        return MedicalDocument.objects.create(
            owner=self.context["request"].user,
            original_filename=uploaded_file.name,
            content_type=getattr(uploaded_file, "content_type", ""),
            size_bytes=uploaded_file.size,
            status=MedicalDocument.ProcessingStatus.UPLOADED,
            analysis_handoff={
                "ready_for": self._handoff_target(validated_data["document_type"]),
                "status": "pending",
                "notes": "Document uploaded and awaiting future extraction/AI analysis.",
            },
            **validated_data,
        )

    def _handoff_target(self, document_type: str) -> str:
        if document_type == MedicalDocument.DocumentType.LAB_REPORT:
            return "report_analysis"
        if document_type == MedicalDocument.DocumentType.PRESCRIPTION:
            return "prescription_analysis"
        return "medical_vault_review"


class DocumentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalDocument
        fields = ["id", "status", "failure_reason", "analysis_handoff", "updated_at"]
        read_only_fields = ["id", "failure_reason", "analysis_handoff", "updated_at"]
