from rest_framework import serializers

from .models import AssistantConversation, AssistantMessage


class AssistantMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantMessage
        fields = [
            "id",
            "role",
            "content",
            "safety_flags",
            "cited_context",
            "created_at",
        ]
        read_only_fields = fields


class AssistantConversationSerializer(serializers.ModelSerializer):
    messages = AssistantMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AssistantConversation
        fields = [
            "id",
            "title",
            "context_snapshot",
            "model_name",
            "prompt_version",
            "safety_review_required",
            "safety_review_notes",
            "created_at",
            "updated_at",
            "messages",
        ]
        read_only_fields = fields


class AssistantTurnSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    conversation_id = serializers.IntegerField(required=False)
