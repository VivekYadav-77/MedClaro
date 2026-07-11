from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ChildGrowthMeasurement,
    ChildGrowthProfile,
    FutureModuleRoadmap,
    InsurancePolicy,
    SecondOpinionRequest,
    VaccinationRecord,
    WearableIntegrationPlan,
    WomensHealthRecord,
)
from .serializers import (
    ChildGrowthMeasurementSerializer,
    ChildGrowthProfileSerializer,
    FutureModuleRoadmapSerializer,
    HealthEducationContentSerializer,
    InsurancePolicySerializer,
    PartnerIntegrationBoundarySerializer,
    SecondOpinionRequestSerializer,
    VaccinationRecordSerializer,
    WearableIntegrationPlanSerializer,
    WomensHealthRecordSerializer,
)
from .services import (
    build_ecosystem_strategy,
    build_wearable_metric_plan,
    ensure_health_education_content,
    ensure_integration_boundaries,
    ensure_roadmap,
)


class EcosystemStrategyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_ecosystem_strategy(request.user))


class RoadmapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = ensure_roadmap(request.user)
        return Response(FutureModuleRoadmapSerializer(records, many=True).data)


class VaccinationRecordListCreateView(ListCreateAPIView):
    serializer_class = VaccinationRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VaccinationRecord.objects.filter(owner=self.request.user)


class WomensHealthRecordListCreateView(ListCreateAPIView):
    serializer_class = WomensHealthRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WomensHealthRecord.objects.filter(owner=self.request.user)


class ChildGrowthProfileListCreateView(ListCreateAPIView):
    serializer_class = ChildGrowthProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChildGrowthProfile.objects.filter(owner=self.request.user).prefetch_related("measurements")


class ChildGrowthMeasurementListCreateView(ListCreateAPIView):
    serializer_class = ChildGrowthMeasurementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChildGrowthMeasurement.objects.filter(child__owner=self.request.user, child_id=self.kwargs["child_id"])

    def perform_create(self, serializer):
        child = ChildGrowthProfile.objects.get(owner=self.request.user, id=self.kwargs["child_id"])
        serializer.save(
            child=child,
            doctor_prompts=[
                "Discuss growth changes with a pediatrician using age, height, weight, and symptoms together."
            ],
        )


class InsurancePolicyListCreateView(ListCreateAPIView):
    serializer_class = InsurancePolicySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InsurancePolicy.objects.filter(owner=self.request.user)


class SecondOpinionRequestListCreateView(ListCreateAPIView):
    serializer_class = SecondOpinionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SecondOpinionRequest.objects.filter(owner=self.request.user)


class HealthEducationLibraryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        records = ensure_health_education_content()
        return Response(HealthEducationContentSerializer(records, many=True).data)


class WearableIntegrationPlanListCreateView(ListCreateAPIView):
    serializer_class = WearableIntegrationPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WearableIntegrationPlan.objects.filter(owner=self.request.user)


class WearableStrategyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_wearable_metric_plan(request.user))


class IntegrationBoundaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        records = ensure_integration_boundaries()
        return Response(PartnerIntegrationBoundarySerializer(records, many=True).data)
