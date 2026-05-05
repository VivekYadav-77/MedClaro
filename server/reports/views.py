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
        specialty = request.data.get("specialty", "general").strip() or "general"
        reports = [
            hydrator.hydrate(item)
            for item in Report.objects.filter(user=request.user).order_by("-upload_date").prefetch_related("chat_messages")[:8]
        ]
        try:
            result = ReportService().ai.generate_specialty_prebrief(reports, specialty, request.user.preferred_language)
        except Exception:
            result = ReportService().ai.fallback_specialty_prebrief(reports, specialty)
        return Response(result)


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
            ai = GeminiService()
            result = ai.generate_diet_advice(abnormal, request.user.preferred_language)
        except Exception:
            result = GeminiService().fallback_diet_advice(abnormal, request.user.preferred_language)
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
            ai = GeminiService()
            result = ai.analyze_treatment_effectiveness(
                prescriptions=prescriptions,
                blood_reports=blood_reports,
                language=request.user.preferred_language,
            )
        except Exception:
            result = GeminiService().fallback_treatment_effectiveness(
                prescriptions=prescriptions,
                blood_reports=blood_reports,
                language=request.user.preferred_language,
            )
        return Response(result)


class MedicationConflictView(APIView):
    def get(self, request):
        hydrator = ReportHydrator()
        reports = [
            hydrator.hydrate(report)
            for report in Report.objects.filter(user=request.user).order_by("-upload_date").prefetch_related("chat_messages")[:12]
        ]
        if not any(report.get("medications") for report in reports):
            return Response({
                "conflicts": [],
                "overallMessage": "Upload at least one prescription to screen medication conflicts.",
            })
        try:
            result = GeminiService().analyze_medication_conflicts(reports, request.user.preferred_language)
        except Exception:
            result = GeminiService().fallback_medication_conflicts(reports)
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
            answer = self._fallback_global_answer(health_state, message)
        return Response({"message": answer})

    def _fallback_global_answer(self, health_state: dict, message: str) -> str:
        lowered = message.lower()
        reports = health_state.get("reports", [])
        all_markers = [
            marker
            for report in reports
            for marker in report.get("abnormalMarkers", [])
        ]
        matching = [
            marker for marker in all_markers
            if marker.get("name") and marker.get("name", "").lower() in lowered
        ]
        markers = matching or all_markers[:5]
        if markers:
            marker_text = ", ".join(
                f"{marker.get('name')}: {marker.get('value')} {marker.get('unit', '')} ({marker.get('flag')})".strip()
                for marker in markers[:5]
            )
            return (
                "Gemini is unavailable, so I can only summarize saved report data right now. "
                f"Relevant abnormal markers I found: {marker_text}. "
                "Please use this as preparation for a clinician discussion."
            )
        if reports:
            return (
                "Gemini is unavailable, but I found saved reports and no abnormal markers in the compact health state. "
                "Ask about a specific report or marker and I can summarize the stored values."
            )
        return "I do not see saved reports to answer from yet. Upload reports first, then ask again."
