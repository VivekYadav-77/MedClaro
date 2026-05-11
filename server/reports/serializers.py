from rest_framework import serializers

from reports.models import ReportShare


class ReportChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1, max_length=1200)


class ReportUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    familyMemberId = serializers.UUIDField(required=False, allow_null=True)


class ReportShareSerializer(serializers.ModelSerializer):
    circleId = serializers.UUIDField(source="circle_id", read_only=True)
    circleName = serializers.CharField(source="circle.name", read_only=True)
    sharedBy = serializers.CharField(source="shared_by.name", read_only=True)
    consentGrantedBy = serializers.CharField(source="consent_granted_by.name", read_only=True)
    accessLevel = serializers.CharField(source="access_level", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    revokedAt = serializers.DateTimeField(source="revoked_at", read_only=True)

    class Meta:
        model = ReportShare
        fields = [
            "id",
            "circleId",
            "circleName",
            "status",
            "accessLevel",
            "sharedBy",
            "consentGrantedBy",
            "createdAt",
            "revokedAt",
        ]
