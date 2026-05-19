from rest_framework import serializers

from reports.services import EncryptionService
from users.models import FamilyMember, User


encryptor = EncryptionService()


def normalize_allergies(value) -> list[dict]:
    if not isinstance(value, list):
        return []
    allergies = []
    for item in value[:30]:
        if isinstance(item, str):
            name = item.strip()
            reaction = ""
        elif isinstance(item, dict):
            name = str(item.get("name") or item.get("allergen") or "").strip()
            reaction = str(item.get("reaction") or "").strip()
        else:
            continue
        if name:
            allergies.append({"name": name[:120], "reaction": reaction[:160]})
    return allergies


class SettingsPayloadSerializer(serializers.Serializer):
    notifications = serializers.BooleanField(default=True)
    nudges = serializers.BooleanField(default=True)


class FamilyMemberSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    biologicalSex = serializers.CharField(source="biological_sex")
    allergies = serializers.SerializerMethodField()

    class Meta:
        model = FamilyMember
        fields = ["id", "name", "relationship", "dob", "biologicalSex", "allergies"]

    def get_id(self, obj):
        return str(obj.id)

    def get_allergies(self, obj):
        return normalize_allergies(obj.allergies)


class FamilyMemberCreateSerializer(serializers.ModelSerializer):
    biologicalSex = serializers.CharField(source="biological_sex")
    allergies = serializers.JSONField(required=False)

    class Meta:
        model = FamilyMember
        fields = ["name", "relationship", "dob", "biologicalSex", "allergies"]

    def validate_allergies(self, value):
        return normalize_allergies(value)


class FamilyMemberUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=False)
    relationship = serializers.CharField(required=False, allow_blank=False)
    dob = serializers.DateTimeField(required=False)
    biologicalSex = serializers.CharField(source="biological_sex", required=False)
    allergies = serializers.JSONField(required=False)

    def validate_allergies(self, value):
        return normalize_allergies(value)


class UserProfileSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField()
    googleId = serializers.CharField(source="google_id", allow_null=True)
    email = serializers.SerializerMethodField()
    biologicalSex = serializers.CharField(source="biological_sex", allow_null=True)
    preferredLanguage = serializers.CharField(source="preferred_language")
    familyMembers = serializers.SerializerMethodField()
    allergies = serializers.SerializerMethodField()
    settings = SettingsPayloadSerializer()
    createdAt = serializers.DateTimeField(source="created_at")
    deletedAt = serializers.DateTimeField(source="deleted_at", allow_null=True)
    isVerified = serializers.BooleanField(source="is_verified")
    isGuest = serializers.BooleanField(source="is_guest")

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
            "allergies",
            "familyMembers",
            "settings",
            "createdAt",
            "deletedAt",
            "isVerified",
            "isGuest",
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

    def get_allergies(self, obj):
        return normalize_allergies(obj.allergies)


class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=False)
    dob = serializers.DateTimeField(required=False, allow_null=True)
    biologicalSex = serializers.CharField(source="biological_sex", required=False, allow_null=True)
    preferredLanguage = serializers.CharField(source="preferred_language", required=False)
    allergies = serializers.JSONField(required=False)
    settings = SettingsPayloadSerializer(required=False)

    def validate_allergies(self, value):
        return normalize_allergies(value)


class AuthCallbackSerializer(serializers.Serializer):
    google_id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    avatar_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GuestLoginSerializer(serializers.Serializer):
    name = serializers.CharField(default="Guest")
