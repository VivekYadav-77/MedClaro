import json

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.access import accessible_reports, can_contribute_to_circle, share_report_with_circle, shared_or_owned_reports
from reports.models import EmergencyCardAccess, EmergencyEvent, Report, ReportShare, WearableMetric
from reports.serializers import ReportChatRequestSerializer, ReportShareSerializer, WearableMetricImportSerializer
from reports.services import GeminiService, RateLimiter, ReportHydrator, ReportService, TrendService
from reminders.models import Reminder


def get_accessible_report_queryset(user, circle_id=None):
    return accessible_reports(user, circle_id=circle_id)


def get_shared_report_queryset(user):
    return shared_or_owned_reports(user)


def build_health_context(user, circle_id=None, limit=5):
    hydrator = ReportHydrator()
    reports = (
        get_accessible_report_queryset(user, circle_id)
        .select_related("user", "family_member")
        .prefetch_related("chat_messages")
        .order_by("-upload_date")[:limit]
    )
    all_reports = [hydrator.hydrate(report) for report in reports]
    medications = [
        {
            "name": medication.get("name"),
            "dosage": medication.get("dosage"),
            "frequency": medication.get("frequency"),
            "purpose": medication.get("purpose"),
            "sourceDate": str(report.get("reportDate") or report.get("uploadDate") or "")[:10],
        }
        for report in all_reports
        for medication in (report.get("medications") or [])
        if medication.get("name")
    ]
    chronic_watch_markers = [
        marker
        for report in all_reports
        for marker in report.get("structuredData", [])
        if marker.get("flag") != "normal"
    ][:18]
    return {
        "reportCount": len(all_reports),
        "activeMedicationCount": len({item["name"].lower() for item in medications if item.get("name")}),
        "watchMarkerCount": len(chronic_watch_markers),
        "medications": medications[:20],
        "watchMarkers": chronic_watch_markers,
        "reports": [
            {
                "owner": report.get("ownerName"),
                "familyMember": report.get("familyMemberName"),
                "type": report["reportType"],
                "date": str(report.get("reportDate") or report["uploadDate"])[:10],
                "abnormalMarkers": [
                    {"name": item["testName"], "value": item["value"], "unit": item["unit"], "flag": item["flag"]}
                    for item in report["structuredData"]
                    if item.get("flag") != "normal"
                ][:10],
                "medications": [medication["name"] for medication in (report.get("medications") or [])],
                "summary": report["aiExplanation"].get("holisticSummary", ""),
            }
            for report in all_reports
        ],
    }


class ReportListCreateView(APIView):
    def get(self, request):
        family_member_id = request.query_params.get("familyMemberId")
        circle_id = request.query_params.get("circleId")
        reports = get_accessible_report_queryset(request.user, circle_id)
        if family_member_id:
            reports = reports.filter(family_member_id=family_member_id)
        hydrator = ReportHydrator()
        return Response([hydrator.hydrate(report) for report in reports.prefetch_related("chat_messages")])

    def post(self, request):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def _latest_report_for_emergency(user, circle_id=None):
    queryset = accessible_reports(user, circle_id=circle_id).prefetch_related("chat_messages")
    return queryset.order_by("-upload_date").first()


def _emergency_report_context(report):
    if not report:
        return {
            "medications": [],
            "abnormalMarkers": [],
            "reportDate": None,
            "reportType": None,
        }
    hydrated = ReportHydrator().hydrate(report)
    return {
        "reportId": str(report.id),
        "reportType": hydrated.get("reportType"),
        "reportDate": hydrated.get("reportDate"),
        "medications": [item.get("name") for item in hydrated.get("medications", []) if item.get("name")][:12],
        "abnormalMarkers": [
            {
                "name": item.get("testName"),
                "value": item.get("value"),
                "unit": item.get("unit", ""),
                "flag": item.get("flag"),
            }
            for item in hydrated.get("structuredData", [])
            if item.get("flag") != "normal"
        ][:12],
        "familyMemberId": hydrated.get("familyMemberId"),
        "familyMemberName": hydrated.get("familyMemberName"),
    }


def _build_emergency_summary(user, context, location_payload=None):
    medications = ", ".join(context.get("medications") or []) or "none listed"
    markers = context.get("abnormalMarkers") or []
    marker_text = ", ".join(
        f"{marker.get('name')} {marker.get('value')} {marker.get('unit', '')} ({marker.get('flag')})".strip()
        for marker in markers[:6]
    ) or "none listed"
    location = location_payload or {}
    location_text = ""
    if location.get("latitude") is not None and location.get("longitude") is not None:
        location_text = f" Location: {location.get('latitude')}, {location.get('longitude')}."
    subject_name = context.get("familyMemberName") or user.name
    return (
        f"MEDCLARO EMERGENCY INFO: {subject_name}. "
        f"Recent active medications: {medications}. "
        f"Recent abnormal markers: {marker_text}."
        f"{location_text} This is shared from saved health records and should be verified clinically."
    )


def _circle_recipients(circle_id, requester):
    if not circle_id:
        return []
    try:
        from circles.models import CircleMember
    except Exception:
        return []
    requester_membership = CircleMember.objects.filter(circle_id=circle_id, user=requester).first()
    if not requester_membership:
        return []
    return [
        member.user
        for member in CircleMember.objects.filter(circle_id=circle_id, role__in=["admin", "caregiver"]).select_related("user")
        if member.user_id != requester.id
    ]


def _user_belongs_to_circle(circle_id, user):
    if not circle_id:
        return True
    try:
        from circles.models import CircleMember
    except Exception:
        return False
    return CircleMember.objects.filter(circle_id=circle_id, user=user).exists()


def _publish_emergency_feed(event, event_type, payload, recipients):
    if not event.circle_id:
        return None
    from circles.models import ActivityFeedEntry, Notification

    entry = ActivityFeedEntry.objects.create(
        circle=event.circle,
        actor=event.requester,
        event_type=event_type,
        payload=payload,
    )
    Notification.objects.bulk_create([Notification(user=user, feed_entry=entry) for user in recipients])
    return entry


class EmergencySosView(APIView):
    def post(self, request):
        circle_id = request.data.get("circleId") or None
        if circle_id and not _user_belongs_to_circle(circle_id, request.user):
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        location_payload = request.data.get("location") if isinstance(request.data.get("location"), dict) else {}
        latest_report = _latest_report_for_emergency(request.user, circle_id=circle_id)
        context = _emergency_report_context(latest_report)
        summary_text = _build_emergency_summary(request.user, context, location_payload)
        recipients = _circle_recipients(circle_id, request.user)
        event = EmergencyEvent.objects.create(
            requester=request.user,
            circle_id=circle_id,
            latest_report=latest_report,
            report_context=context,
            location_payload=location_payload,
            summary_text=summary_text,
            recipient_count=len(recipients),
        )
        _publish_emergency_feed(
            event,
            "emergency_sos",
            {
                "eventId": str(event.id),
                "summaryText": summary_text,
                "recipientCount": len(recipients),
                "familyMemberName": context.get("familyMemberName"),
            },
            recipients,
        )
        api_prefix = settings.API_V1_PREFIX.rstrip("/")
        access_url = request.build_absolute_uri(f"{api_prefix}/emergency-card/{event.id}/access")
        return Response(
            {
                "eventId": str(event.id),
                "shareText": summary_text,
                "recipientCount": len(recipients),
                "accessUrl": access_url,
                "message": (
                    f"In-app emergency alert sent to {len(recipients)} Care Circle recipient(s)."
                    if recipients
                    else "No Care Circle admins or caregivers were available; use the share button to send this manually."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class EmergencyCardAccessView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, event_id):
        event = EmergencyEvent.objects.filter(id=event_id).select_related("requester", "circle", "latest_report").first()
        if not event:
            return Response({"error": "Emergency event not found"}, status=status.HTTP_404_NOT_FOUND)
        access = EmergencyCardAccess.objects.create(
            event=event,
            owner=event.requester,
            report=event.latest_report,
            family_member_id=event.report_context.get("familyMemberId"),
            ip_address=self._client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
            metadata={"method": request.method},
        )
        recipients = _circle_recipients(str(event.circle_id), event.requester) if event.circle_id else []
        _publish_emergency_feed(
            event,
            "emergency_card_accessed",
            {"eventId": str(event.id), "accessId": str(access.id), "familyMemberName": event.report_context.get("familyMemberName")},
            recipients,
        )
        return Response({"message": "Emergency card access logged", "summaryText": event.summary_text})

    def get(self, request, event_id):
        return self.post(request, event_id)

    def _client_ip(self, request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")


class IntegrationStatusView(APIView):
    def get(self, request):
        return Response(
            {
                "mode": "free",
                "emergencyAlerts": "in_app_care_circle",
                "nativeShare": "browser_supported",
                "manualHealthImport": "enabled",
                "paidProviders": {
                    "sms": "disabled",
                    "whatsappBusiness": "disabled",
                    "googleFitOAuth": "disabled",
                },
            }
        )


class WearableMetricImportView(APIView):
    def post(self, request):
        rows = request.data.get("rows", request.data)
        if not isinstance(rows, list):
            return Response({"error": "Expected an array or {rows: [...]}"}, status=status.HTTP_400_BAD_REQUEST)
        imported = []
        errors = []
        for index, row in enumerate(rows):
            serializer = WearableMetricImportSerializer(data=row)
            if not serializer.is_valid():
                errors.append({"index": index, "errors": serializer.errors})
                continue
            data = serializer.validated_data
            metric = WearableMetric.objects.create(
                user=request.user,
                metric_type=data["metricType"],
                value=data["value"],
                unit=data.get("unit", ""),
                recorded_at=data["recordedAt"],
                source=data.get("source", "manual_import") or "manual_import",
            )
            imported.append({"id": str(metric.id), "metricType": metric.metric_type})
        return Response({"importedCount": len(imported), "errorCount": len(errors), "imported": imported, "errors": errors})


class ReportUploadView(APIView):
    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"error": "File is required", "code": "FILE_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST)
        family_member_id = request.data.get("familyMemberId")
        circle_id = request.data.get("circleId")
        if circle_id:
            if not can_contribute_to_circle(circle_id, request.user):
                return Response({"error": "Only circle admins and caregivers can share uploads"}, status=status.HTTP_403_FORBIDDEN)
        data = ReportService().create_report(upload, family_member_id, request.user, circle_id=circle_id)
        return Response(data)


class ReportDetailView(APIView):
    def get_report(self, request, report_id):
        return get_shared_report_queryset(request.user).filter(id=report_id).prefetch_related("chat_messages").first()

    def get(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReportHydrator().hydrate(report))

    def delete(self, request, report_id):
        report = Report.objects.filter(id=report_id, user=request.user).prefetch_related("chat_messages").first()
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
        circle_id = request.query_params.get("circleId")
        reports = [
            hydrator.hydrate(report)
            for report in get_accessible_report_queryset(request.user, circle_id).prefetch_related("chat_messages")
        ]
        return Response(TrendService().build(reports, request.user.preferred_language))


class ReportChatView(APIView):
    def get_report(self, request, report_id):
        return get_shared_report_queryset(request.user).filter(id=report_id).prefetch_related("chat_messages").first()

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
        report = get_shared_report_queryset(request.user).filter(id=report_id).prefetch_related("chat_messages").first()
        if not report:
            return Response({"error": "Report not found", "code": "REPORT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)
        hydrator = ReportHydrator()
        specialty = request.data.get("specialty", "general").strip() or "general"
        reports = [
            hydrator.hydrate(item)
            for item in get_shared_report_queryset(request.user)
            .filter(user=report.user)
            .order_by("-upload_date")
            .prefetch_related("chat_messages")[:8]
        ]
        try:
            result = ReportService().ai.generate_specialty_prebrief(reports, specialty, request.user.preferred_language)
        except Exception:
            result = ReportService().ai.fallback_specialty_prebrief(reports, specialty)
        return Response(result)


class ReportShareView(APIView):
    def get_report(self, request, report_id):
        return Report.objects.filter(id=report_id, user=request.user).first()

    def get(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        shares = ReportShare.objects.filter(report=report).select_related("circle", "shared_by", "consent_granted_by")
        return Response(ReportShareSerializer(shares, many=True).data)

    def post(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        circle_id = request.data.get("circleId")
        if not circle_id:
            return Response({"error": "circleId required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            share = share_report_with_circle(report, circle_id, request.user)
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(ReportShareSerializer(share).data, status=status.HTTP_201_CREATED)

    def delete(self, request, report_id):
        report = self.get_report(request, report_id)
        if not report:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        circle_id = request.data.get("circleId") or request.query_params.get("circleId")
        if not circle_id:
            return Response({"error": "circleId required"}, status=status.HTTP_400_BAD_REQUEST)
        updated = ReportShare.objects.filter(report=report, circle_id=circle_id, status="active").update(
            status="revoked",
            revoked_at=timezone.now(),
        )
        if not updated:
            return Response({"error": "Active share not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Report share revoked"})


class ReportDietAdviceView(APIView):
    def get(self, request, report_id):
        report = get_shared_report_queryset(request.user).filter(id=report_id).prefetch_related("chat_messages").first()
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
        circle_id = request.query_params.get("circleId")
        all_reports = [
            hydrator.hydrate(report)
            for report in get_accessible_report_queryset(request.user, circle_id)
            .order_by("upload_date")
            .prefetch_related("chat_messages")
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
        circle_id = request.query_params.get("circleId")
        reports = [
            hydrator.hydrate(report)
            for report in get_accessible_report_queryset(request.user, circle_id).order_by("-upload_date").prefetch_related("chat_messages")[:12]
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
    def get(self, request):
        circle_id = request.query_params.get("circleId")
        return Response({"healthContext": build_health_context(request.user, circle_id=circle_id, limit=5)})

    def post(self, request):
        RateLimiter().enforce(request.user, "global_chat", settings.CHAT_LIMIT_PER_DAY)
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

        circle_id = request.data.get("circleId")
        health_state = build_health_context(request.user, circle_id=circle_id, limit=5)
        language = request.user.preferred_language
        prompt = f"""
You are a personal health assistant with full access to the user's medical history.
Answer only based on the provided health state. Cite specific values when relevant.
If asked about something not in the data, say so plainly.
Use medication and chronic-condition context when it is relevant.
Never diagnose, never tell the user to start/stop/change medicine, and recommend clinician review for safety-critical concerns.
Respond in language code {language}.
User question: {message}
Health state: {json.dumps(health_state, default=str)}
"""
        try:
            answer = GeminiService().generate_chat_text(prompt, timeout=30)
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
