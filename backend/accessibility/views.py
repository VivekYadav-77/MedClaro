from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LocalizedContentArtifact, VoiceSummaryArtifact
from .serializers import (
    AccessibilityPreferenceSerializer,
    LocalizedContentArtifactSerializer,
    VoiceSummaryArtifactSerializer,
)
from .services import (
    build_accessibility_plan,
    build_simplified_dashboard,
    get_or_create_preferences,
)


class PreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(AccessibilityPreferenceSerializer(get_or_create_preferences(request.user)).data)

    def patch(self, request):
        preference = get_or_create_preferences(request.user)
        serializer = AccessibilityPreferenceSerializer(
            preference,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AccessibilityPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_accessibility_plan(request.user))


class SimplifiedDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_simplified_dashboard(request.user))


class LocalizedContentArtifactListCreateView(ListCreateAPIView):
    serializer_class = LocalizedContentArtifactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LocalizedContentArtifact.objects.filter(owner=self.request.user)


class VoiceSummaryArtifactListCreateView(ListCreateAPIView):
    serializer_class = VoiceSummaryArtifactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VoiceSummaryArtifact.objects.filter(owner=self.request.user)
