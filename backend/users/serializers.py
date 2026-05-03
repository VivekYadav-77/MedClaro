from rest_framework import serializers

from reports.services import EncryptionService
from users.models import FamilyMember, User


encryptor = EncryptionService()


class SettingsPayloadSerializer(serializers.Serializer):
    notifications = serializers.BooleanField(default=True)
    nudges = serializers.BooleanField(default=True)


class FamilyMemberSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    biologicalSex = serializers.CharField(source="biological_sex")

    class Meta:
        model = FamilyMember
        fields = ["id", "name", "relationship", "dob", "biologicalSex"]

    def get_id(self, obj):
        return str(obj.id)


class FamilyMemberCreateSerializer(serializers.ModelSerializer):
    biologicalSex = serializers.CharField(source="biological_sex")

    class Meta:
        model = FamilyMember
        fields = ["name", "relationship", "dob", "biologicalSex"]


class UserProfileSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField()
    googleId = serializers.CharField(source="google_id")
    email = serializers.SerializerMethodField()
    biologicalSex = serializers.CharField(source="biological_sex", allow_null=True)
    preferredLanguage = serializers.CharField(source="preferred_language")
    familyMembers = serializers.SerializerMethodField()
    settings = SettingsPayloadSerializer()
    createdAt = serializers.DateTimeField(source="created_at")
    deletedAt = serializers.DateTimeField(source="deleted_at", allow_null=True)

    class Meta:
        model = User
        fields = [
            "_id",
            "googleId",
            "email",
            "name",
            "dob",
            "biologicalSex",
            "preferredLanguage",
            "familyMembers",
            "settings",
            "createdAt",
            "deletedAt",
        ]

    def get__id(self, obj):
        return str(obj.id)

    def get_email(self, obj):
        payload = obj.email_encrypted or {}
        if payload.get("ciphertext"):
            return encryptor.decrypt_json(payload).get("value", "")
        return ""

    def get_familyMembers(self, obj):
        return FamilyMemberSerializer(obj.family_members.all(), many=True).data


class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=False)
    dob = serializers.DateTimeField(required=False, allow_null=True)
    biologicalSex = serializers.CharField(source="biological_sex", required=False, allow_null=True)
    preferredLanguage = serializers.CharField(source="preferred_language", required=False)
    settings = SettingsPayloadSerializer(required=False)


class AuthCallbackSerializer(serializers.Serializer):
    google_id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    avatar_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
