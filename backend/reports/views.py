from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.models import Report
from reports.serializers import ReportChatRequestSerializer
from reports.services import ReportHydrator, ReportService, TrendService
from reminders.models import Reminder


class ReportListCreateView(APIView):
    def get(self, request):
        family_member_id = request.query_params.get("familyMemberId")
        reports = Report.objects.filter(user=request.user)
        if family_member_id:
            reports = reports.filter(family_member_id=family_member_id)
        hydrator = ReportHydrator()
        return Response([hydrator.hydrate(report) for report in reports.prefetch_related("chat_messages")])

    def post(self, request):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


class ReportUploadView(APIView):
    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"error": "File is required", "code": "FILE_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST)
        family_member_id = request.data.get("familyMemberId")
        data = ReportService().create_report(upload, family_member_id, request.user)
        return Response(data)


class ReportDetailView(APIView):
    def get_report(self, request, report_id):
        return Report.objects.filter(id=report_id, user=request.user).prefetch_related("chat_messages").first()

    def get(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReportHydrator().hydrate(report))

    def delete(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        service = ReportService()
        if report.file_ref:
            service.storage.delete_object(report.file_ref)
        Reminder.objects.filter(report=report).delete()
        report.delete()
        return Response({"message": "Report deleted"})


class ReportTrendsView(APIView):
    def get(self, request):
        hydrator = ReportHydrator()
        reports = [hydrator.hydrate(report) for report in Report.objects.filter(user=request.user).prefetch_related("chat_messages")]
        return Response(TrendService().build(reports))


class ReportChatView(APIView):
    def get_report(self, request, report_id):
        return Report.objects.filter(id=report_id, user=request.user).prefetch_related("chat_messages").first()

    def get(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        hydrated = ReportHydrator().hydrate(report)
        return Response({"chatHistory": hydrated.get("chatHistory", [])})

    def post(self, request, report_id):
        serializer = ReportChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReportService().chat_about_report(report, serializer.validated_data["message"], request.user))


class ReportSummaryView(APIView):
    def post(self, request, report_id):
        report = Report.objects.filter(id=report_id, user=request.user).prefetch_related("chat_messages").first()
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        hydrator = ReportHydrator()
        hydrated = hydrator.hydrate(report)
        previous = (
            Report.objects.filter(user=request.user, report_type=report.report_type)
            .exclude(id=report.id)
            .order_by("-report_date", "-upload_date")
            .prefetch_related("chat_messages")
            .first()
        )
        previous_hydrated = hydrator.hydrate(previous) if previous else None
        return Response(ReportService().ai.generate_summary(hydrated, previous_hydrated, hydrated["language"]))
