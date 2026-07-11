from rest_framework import serializers

from .models import (
    Allergy,
    EmergencyContact,
    FamilyHistoryItem,
    HealthProfile,
    KnownCondition,
)


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = ["id", "name", "reaction", "severity", "notes"]
        read_only_fields = ["id"]


class KnownConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnownCondition
        fields = ["id", "name", "diagnosed_year", "status", "notes"]
        read_only_fields = ["id"]


class FamilyHistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyHistoryItem
        fields = ["id", "relation", "condition", "notes"]
        read_only_fields = ["id"]


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ["id", "name", "relation", "phone", "email", "is_primary"]
        read_only_fields = ["id"]


class HealthProfileSerializer(serializers.ModelSerializer):
    allergies = AllergySerializer(many=True, required=False)
    known_conditions = KnownConditionSerializer(many=True, required=False)
    family_history = FamilyHistoryItemSerializer(many=True, required=False)
    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = HealthProfile
        fields = [
            "id",
            "age",
            "gender",
            "height_cm",
            "weight_kg",
            "blood_group",
            "occupation",
            "smoking",
            "alcohol",
            "exercise",
            "sleep_hours",
            "pregnancy_status",
            "preferred_language",
            "food_preference",
            "location",
            "privacy_consent",
            "completion_percentage",
            "allergies",
            "known_conditions",
            "family_history",
            "emergency_contacts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "completion_percentage", "created_at", "updated_at"]

    def validate(self, attrs):
        gender = attrs.get("gender", getattr(self.instance, "gender", ""))
        pregnancy_status = attrs.get(
            "pregnancy_status",
            getattr(self.instance, "pregnancy_status", ""),
        )
        if pregnancy_status and gender == HealthProfile.Gender.MALE:
            raise serializers.ValidationError(
                {
                    "pregnancy_status": "Pregnancy status is only applicable when clinically relevant."
                }
            )
        return attrs

    def create(self, validated_data):
        nested = self._pop_nested(validated_data)
        profile = HealthProfile.objects.create(**validated_data)
        self._replace_nested(profile, nested)
        return profile

    def update(self, instance, validated_data):
        nested = self._pop_nested(validated_data)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        self._replace_nested(instance, nested)
        return instance

    def _pop_nested(self, validated_data):
        return {
            "allergies": validated_data.pop("allergies", None),
            "known_conditions": validated_data.pop("known_conditions", None),
            "family_history": validated_data.pop("family_history", None),
            "emergency_contacts": validated_data.pop("emergency_contacts", None),
        }

    def _replace_nested(self, profile, nested):
        relation_map = {
            "allergies": Allergy,
            "known_conditions": KnownCondition,
            "family_history": FamilyHistoryItem,
            "emergency_contacts": EmergencyContact,
        }
        for relation, model in relation_map.items():
            rows = nested.get(relation)
            if rows is None:
                continue
            getattr(profile, relation).all().delete()
            model.objects.bulk_create([model(profile=profile, **row) for row in rows])


class HealthProfileContextSerializer(serializers.ModelSerializer):
    allergies = AllergySerializer(many=True, read_only=True)
    known_conditions = KnownConditionSerializer(many=True, read_only=True)
    family_history = FamilyHistoryItemSerializer(many=True, read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = HealthProfile
        fields = [
            "age",
            "gender",
            "height_cm",
            "weight_kg",
            "blood_group",
            "occupation",
            "smoking",
            "alcohol",
            "exercise",
            "sleep_hours",
            "pregnancy_status",
            "preferred_language",
            "food_preference",
            "location",
            "completion_percentage",
            "allergies",
            "known_conditions",
            "family_history",
            "emergency_contacts",
        ]
