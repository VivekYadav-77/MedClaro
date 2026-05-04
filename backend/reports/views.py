import json

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.models import Report
from reports.serializers import ReportChatRequestSerializer
from reports.services import GeminiService, RateLimiter, ReportHydrator, ReportService, TrendService
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
        return Response(TrendService().build(reports, request.user.preferred_language))


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


class ReportDietAdviceView(APIView):
    def get(self, request, report_id):
        report = Report.objects.filter(id=report_id, user=request.user).prefetch_related("chat_messages").first()
        if not report:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        hydrated = ReportHydrator().hydrate(report)
        abnormal = [item for item in hydrated["structuredData"] if item.get("flag") != "normal"]
        if not abnormal:
            return Response({"advice": [], "message": "All markers are within normal range."})
        try:
            result = GeminiService().generate_diet_advice(abnormal, request.user.preferred_language)
        except Exception:
            result = {"advice": [], "message": "Diet advice temporarily unavailable."}
        return Response(result)


class TreatmentEffectivenessView(APIView):
    def get(self, request):
        hydrator = ReportHydrator()
        all_reports = [
            hydrator.hydrate(report)
            for report in Report.objects.filter(user=request.user).order_by("upload_date").prefetch_related("chat_messages")
        ]
        prescriptions = [report for report in all_reports if report["reportType"] == "prescription"]
        blood_reports = [report for report in all_reports if report["reportType"] != "prescription"]
        if not prescriptions or len(blood_reports) < 2:
            return Response({
                "findings": [],
                "message": "Need at least one prescription and two blood reports to analyze treatment effectiveness.",
            })
        try:
            result = GeminiService().analyze_treatment_effectiveness(
                prescriptions=prescriptions,
                blood_reports=blood_reports,
                language=request.user.preferred_language,
            )
        except Exception:
            result = {"findings": [], "message": "Analysis temporarily unavailable."}
        return Response(result)


class GlobalChatView(APIView):
    def post(self, request):
        RateLimiter().enforce(request.user, "global_chat", settings.CHAT_LIMIT_PER_DAY)
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

        hydrator = ReportHydrator()
        reports = Report.objects.filter(user=request.user).prefetch_related("chat_messages").order_by("-upload_date")[:10]
        all_reports = [hydrator.hydrate(report) for report in reports]
        health_state = {
            "reportCount": len(all_reports),
            "reports": [
                {
                    "type": report["reportType"],
                    "date": str(report.get("reportDate") or report["uploadDate"])[:10],
                    "abnormalMarkers": [
                        {"name": item["testName"], "value": item["value"], "unit": item["unit"], "flag": item["flag"]}
                        for item in report["structuredData"]
                        if item.get("flag") != "normal"
                    ],
                    "medications": [medication["name"] for medication in (report.get("medications") or [])],
                    "summary": report["aiExplanation"].get("holisticSummary", ""),
                }
                for report in all_reports
            ],
        }
        language = request.user.preferred_language
        prompt = f"""
You are a personal health assistant with full access to the user's medical history.
Answer only based on the provided health state. Cite specific values when relevant.
If asked about something not in the data, say so plainly.
Never diagnose. Respond in language code {language}.
User question: {message}
Health state: {json.dumps(health_state, default=str)}
"""
        try:
            response = GeminiService().chat_model.generate_content(
                prompt,
                generation_config={"temperature": 0.2},
                request_options={"timeout": 30},
            )
            answer = response.text.strip()
        except Exception:
            answer = "I'm having trouble connecting right now. Please try again in a moment."
        return Response({"message": answer})
