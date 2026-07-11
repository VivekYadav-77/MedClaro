from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import ReportAnalysis
from .serializers import ReportAnalysisCreateSerializer, ReportAnalysisSerializer


class ReportAnalysisViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return (
            ReportAnalysis.objects.filter(owner=self.request.user)
            .select_related("document")
            .prefetch_related("biomarkers")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ReportAnalysisCreateSerializer
        return ReportAnalysisSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        analysis = serializer.save()
        return Response(
            ReportAnalysisSerializer(analysis, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        analysis = self.get_object()
        return Response(
            {
                "id": analysis.id,
                "status": analysis.status,
                "health_status": analysis.health_status,
                "health_score": analysis.health_score,
                "safety_review_required": analysis.safety_review_required,
                "updated_at": analysis.updated_at,
            }
        )
