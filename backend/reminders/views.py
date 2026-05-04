from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from reminders.models import Reminder
from reminders.serializers import ReminderCreateSerializer, ReminderRecordSerializer
from reports.models import Report


class ReminderCreateView(APIView):
    def get(self, request):
        reminders = Reminder.objects.filter(user=request.user, muted=False)
        return Response(ReminderRecordSerializer(reminders, many=True).data)

    def post(self, request):
        serializer = ReminderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = Report.objects.filter(id=serializer.validated_data["reportId"], user=request.user).first()
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        reminder = Reminder.objects.create(
            user=request.user,
            report=report,
            reminder_date=serializer.validated_data["reminderDate"],
        )
        return Response(ReminderRecordSerializer(reminder).data)


class ReminderMuteView(APIView):
    def put(self, request, reminder_id):
        reminder = Reminder.objects.filter(id=reminder_id, user=request.user).first()
        if not reminder:
            return Response({"error": "Reminder not found", "code": "REMINDER_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        reminder.muted = True
        reminder.save(update_fields=["muted"])
        return Response({"message": "Reminder muted"})
