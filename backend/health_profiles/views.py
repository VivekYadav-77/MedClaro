from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import HealthProfile, ProfileAuditEvent
from .serializers import HealthProfileContextSerializer, HealthProfileSerializer


class HealthProfileViewSet(ModelViewSet):
    serializer_class = HealthProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            HealthProfile.objects.filter(user=self.request.user)
            .prefetch_related(
                "allergies",
                "known_conditions",
                "family_history",
                "emergency_contacts",
            )
        )

    def list(self, request, *args, **kwargs):
        profile = self.get_queryset().first()
        if not profile:
            return Response(None, status=status.HTTP_200_OK)
        return Response(self.get_serializer(profile).data)

    def create(self, request, *args, **kwargs):
        if HealthProfile.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "Health profile already exists. Use update instead."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        self._audit(profile, request.user, "created", "Initial health profile created.")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        profile = serializer.save()
        self._audit(profile, self.request.user, "updated", "Health profile updated.")

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        profile = self.get_queryset().first()
        if not profile:
            return Response(None, status=status.HTTP_200_OK)
        return Response(self.get_serializer(profile).data)

    @action(detail=False, methods=["get"], url_path="ai-context")
    def ai_context(self, request):
        profile = self.get_queryset().first()
        if not profile:
            return Response(
                {
                    "profile": None,
                    "privacy_notice": "No Personal Health Profile exists for this user yet.",
                }
            )
        return Response(
            {
                "profile": HealthProfileContextSerializer(profile).data,
                "privacy_notice": (
                    "Use this profile only as bounded context for educational, "
                    "non-diagnostic AI responses."
                ),
            }
        )

    def _audit(self, profile, actor, action: str, summary: str) -> None:
        ProfileAuditEvent.objects.create(
            profile=profile,
            actor=actor,
            action=action,
            summary=summary,
        )
