from rest_framework import serializers

from .models import JournalEntry, LifestylePlan, SymptomLog
from .services import apply_symptom_safety, generate_lifestyle_plan, upsert_journal_timeline


class SymptomLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SymptomLog
        fields = [
            "id",
            "symptom",
            "severity",
            "pain_level",
            "started_at",
            "ended_at",
            "triggers",
            "notes",
            "doctor_consultation_recommended",
            "safety_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "doctor_consultation_recommended",
            "safety_notes",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        symptom = SymptomLog.objects.create(owner=self.context["request"].user, **validated_data)
        return apply_symptom_safety(symptom)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return apply_symptom_safety(instance)


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "entry_date",
            "title",
            "notes",
            "mood",
            "stress",
            "sleep_hours",
            "energy",
            "pain",
            "fever_c",
            "weight_kg",
            "systolic_bp",
            "diastolic_bp",
            "blood_sugar_mg_dl",
            "pulse_bpm",
            "water_ml",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        entry = JournalEntry.objects.create(owner=self.context["request"].user, **validated_data)
        upsert_journal_timeline(entry)
        return entry

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        upsert_journal_timeline(instance)
        return instance


class LifestylePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = LifestylePlan
        fields = [
            "id",
            "plan_type",
            "title",
            "summary",
            "recommendations",
            "restrictions",
            "doctor_consultation_prompts",
            "safety_notes",
            "input_context",
            "model_name",
            "prompt_version",
            "generated_at",
        ]
        read_only_fields = fields


class LifestylePlanCreateSerializer(serializers.Serializer):
    plan_type = serializers.ChoiceField(choices=LifestylePlan.PlanType.choices)

    def create(self, validated_data):
        return generate_lifestyle_plan(
            owner=self.context["request"].user,
            plan_type=validated_data["plan_type"],
        )
