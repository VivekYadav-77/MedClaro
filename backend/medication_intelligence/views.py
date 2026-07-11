from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Medication, PrescriptionAnalysis
from .serializers import (
    MedicationSerializer,
    PrescriptionAnalysisCreateSerializer,
    PrescriptionAnalysisSerializer,
)


class PrescriptionAnalysisViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return (
            PrescriptionAnalysis.objects.filter(owner=self.request.user)
            .select_related("document")
            .prefetch_related(
                "medications",
                "medications__schedules",
                "medications__warnings",
                "medication_warnings",
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return PrescriptionAnalysisCreateSerializer
        return PrescriptionAnalysisSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        analysis = serializer.save()
        return Response(
            PrescriptionAnalysisSerializer(analysis, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        analysis = self.get_object()
        return Response(
            {
                "id": analysis.id,
                "status": analysis.status,
                "medication_count": analysis.medications.count(),
                "warning_count": analysis.medication_warnings.count(),
                "safety_review_required": analysis.safety_review_required,
                "is_expired": analysis.is_expired,
                "updated_at": analysis.updated_at,
            }
        )


class MedicationViewSet(ReadOnlyModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Medication.objects.filter(owner=self.request.user)
            .select_related("analysis", "analysis__document")
            .prefetch_related("schedules", "warnings")
        )
