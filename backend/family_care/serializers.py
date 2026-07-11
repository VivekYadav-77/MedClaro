from rest_framework import serializers

from .models import (
    DoctorSummary,
    EmergencyProfileShare,
    FamilyAccessAudit,
    FamilyCircle,
    FamilyInvitation,
    FamilyMembership,
    PermissionGrant,
)


class PermissionGrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionGrant
        fields = ["id", "permission", "is_allowed", "expires_at", "created_at"]
        read_only_fields = ["id", "created_at"]


class FamilyMembershipSerializer(serializers.ModelSerializer):
    permission_grants = PermissionGrantSerializer(many=True, read_only=True)

    class Meta:
        model = FamilyMembership
        fields = [
            "id",
            "user",
            "display_name",
            "email",
            "role",
            "status",
            "accepted_at",
            "revoked_at",
            "created_at",
            "permission_grants",
        ]
        read_only_fields = ["id", "user", "status", "accepted_at", "revoked_at", "created_at", "permission_grants"]


class FamilyCircleSerializer(serializers.ModelSerializer):
    memberships = FamilyMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = FamilyCircle
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at", "memberships"]
        read_only_fields = ["id", "is_active", "created_at", "updated_at", "memberships"]

    def create(self, validated_data):
        from .services import create_family_circle

        return create_family_circle(
            owner=self.context["request"].user,
            name=validated_data["name"],
            description=validated_data.get("description", ""),
        )


class InviteMemberSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=160)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=FamilyMembership.Role.choices)
    expires_in_days = serializers.IntegerField(required=False, min_value=1, max_value=90, default=14)


class FamilyInvitationSerializer(serializers.ModelSerializer):
    membership = FamilyMembershipSerializer(read_only=True)

    class Meta:
        model = FamilyInvitation
        fields = ["id", "membership", "token", "status", "expires_at", "accepted_at", "revoked_at", "created_at"]
        read_only_fields = fields


class FamilyAccessAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyAccessAudit
        fields = ["id", "action", "summary", "metadata", "created_at"]
        read_only_fields = fields


class DoctorSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSummary
        fields = [
            "id",
            "title",
            "summary_payload",
            "questions_for_doctor",
            "model_name",
            "prompt_version",
            "generated_at",
        ]
        read_only_fields = fields


class EmergencyProfileShareSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = EmergencyProfileShare
        fields = [
            "id",
            "label",
            "token",
            "qr_payload",
            "profile_payload",
            "is_active",
            "is_expired",
            "expires_at",
            "last_accessed_at",
            "created_at",
        ]
        read_only_fields = fields


class EmergencyShareCreateSerializer(serializers.Serializer):
    expires_in_hours = serializers.IntegerField(min_value=1, max_value=168, default=72)
