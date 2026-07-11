from rest_framework import serializers

from .models import TimelineEvent, TrendInsight


class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = [
            "id",
            "event_type",
            "title",
            "summary",
            "event_date",
            "report_analysis",
            "source_type",
            "source_id",
            "tags",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class TrendInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendInsight
        fields = [
            "id",
            "biomarker_name",
            "biomarker_code",
            "unit",
            "label",
            "report_count",
            "first_value",
            "latest_value",
            "delta",
            "graph_points",
            "risk_awareness",
            "doctor_prompts",
            "model_name",
            "prompt_version",
            "generated_at",
        ]
        read_only_fields = fields
