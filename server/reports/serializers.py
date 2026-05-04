from rest_framework import serializers


class ReportChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1, max_length=1200)


class ReportUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    familyMemberId = serializers.UUIDField(required=False, allow_null=True)
