from rest_framework import serializers

from reminders.models import Reminder


class ReminderCreateSerializer(serializers.Serializer):
    reportId = serializers.UUIDField()
    reminderDate = serializers.DateTimeField()


class ReminderRecordSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField()
    userId = serializers.SerializerMethodField()
    reportId = serializers.SerializerMethodField()
    reminderDate = serializers.DateTimeField(source="reminder_date")

    class Meta:
        model = Reminder
        fields = ["_id", "userId", "reportId", "reminderDate", "sent", "muted"]

    def get__id(self, obj):
        return str(obj.id)

    def get_userId(self, obj):
        return str(obj.user_id)

    def get_reportId(self, obj):
        return str(obj.report_id)
