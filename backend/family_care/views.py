from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import DoctorSummary, EmergencyProfileShare, FamilyCircle, FamilyMembership
from .serializers import (
    DoctorSummarySerializer,
    EmergencyProfileShareSerializer,
    EmergencyShareCreateSerializer,
    FamilyAccessAuditSerializer,
    FamilyCircleSerializer,
    FamilyInvitationSerializer,
    InviteMemberSerializer,
)
from .services import (
    access_emergency_share,
    build_family_dashboard,
    create_emergency_share,
    generate_doctor_summary,
    invite_member,
    revoke_membership,
)


class FamilyDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_family_dashboard(request.user))


class FamilyCircleViewSet(ModelViewSet):
    serializer_class = FamilyCircleSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return FamilyCircle.objects.filter(owner=self.request.user).prefetch_related(
            "memberships",
            "memberships__permission_grants",
        )

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        circle = self.get_object()
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = invite_member(circle, request.user, serializer.validated_data)
        return Response(FamilyInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="members/(?P<membership_id>[^/.]+)/revoke")
    def revoke_member(self, request, pk=None, membership_id=None):
        circle = self.get_object()
        membership = FamilyMembership.objects.get(circle=circle, id=membership_id)
        revoke_membership(membership, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def audit(self, request, pk=None):
        circle = self.get_object()
        return Response(FamilyAccessAuditSerializer(circle.audit_events.all(), many=True).data)


class DoctorSummaryViewSet(ModelViewSet):
    serializer_class = DoctorSummarySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return DoctorSummary.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        summary = generate_doctor_summary(request.user)
        return Response(DoctorSummarySerializer(summary).data, status=status.HTTP_201_CREATED)


class EmergencyProfileShareViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]
    lookup_field = "token"

    def get_queryset(self):
        return EmergencyProfileShare.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return EmergencyShareCreateSerializer
        return EmergencyProfileShareSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        share = create_emergency_share(
            owner=request.user,
            expires_in_hours=serializer.validated_data["expires_in_hours"],
        )
        return Response(EmergencyProfileShareSerializer(share).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request, token=None):
        share = self.get_object()
        share.is_active = False
        share.save(update_fields=["is_active"])
        return Response(EmergencyProfileShareSerializer(share).data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def public(self, request, token=None):
        try:
            share = EmergencyProfileShare.objects.get(token=token, is_active=True)
        except EmergencyProfileShare.DoesNotExist:
            return Response({"detail": "Emergency profile not found."}, status=404)
        if share.expires_at <= timezone.now():
            return Response({"detail": "Emergency profile link expired."}, status=410)
        return Response(access_emergency_share(share))
