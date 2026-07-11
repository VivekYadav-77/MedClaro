from django.http import FileResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import DocumentAuditEvent, MedicalDocument
from .serializers import (
    DocumentStatusSerializer,
    MedicalDocumentSerializer,
    MedicalDocumentUploadSerializer,
)


class MedicalDocumentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MedicalDocument.objects.filter(
            owner=self.request.user,
            is_deleted=False,
        )

    def get_serializer_class(self):
        if self.action == "create":
            return MedicalDocumentUploadSerializer
        if self.action == "status":
            return DocumentStatusSerializer
        return MedicalDocumentSerializer

    def perform_create(self, serializer):
        document = serializer.save()
        self._audit(document, self.request.user, "uploaded", "Document uploaded.")

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        document.is_deleted = True
        document.deleted_at = timezone.now()
        document.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
        self._audit(document, request.user, "deleted", "Document soft-deleted.")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        document = self.get_object()
        return Response(DocumentStatusSerializer(document).data)

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        document = self.get_object()
        self._audit(document, request.user, "previewed", "Document preview accessed.")
        return FileResponse(
            document.file.open("rb"),
            content_type=document.content_type or "application/octet-stream",
            as_attachment=False,
            filename=document.original_filename,
        )

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        document = self.get_object()
        self._audit(document, request.user, "downloaded", "Document downloaded.")
        return FileResponse(
            document.file.open("rb"),
            content_type=document.content_type or "application/octet-stream",
            as_attachment=True,
            filename=document.original_filename,
        )

    def _audit(self, document, actor, action: str, summary: str) -> None:
        DocumentAuditEvent.objects.create(
            document=document,
            actor=actor,
            action=action,
            summary=summary,
        )
