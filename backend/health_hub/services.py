from django.db.models import Count
from django.utils import timezone

from ai_services.gemini_config import GEMINI_MODULES
from daily_health.models import JournalEntry, SymptomLog
from health_profiles.models import HealthProfile
from health_trends.models import TimelineEvent, TrendInsight
from medication_intelligence.models import (
    Medication,
    MedicationSchedule,
    MedicationWarning,
    PrescriptionAnalysis,
)
from report_analysis.models import ReportAnalysis

from .models import AssistantConversation, AssistantMessage


PROMPT_VERSION = "health-assistant-v1"
SENSITIVE_TERMS = {
    "diagnose",
    "diagnosis",
    "emergency",
    "urgent",
    "chest pain",
    "suicide",
    "overdose",
    "allergic reaction",
    "trouble breathing",
}


def build_dashboard(owner) -> dict:
    profile = _profile_summary(owner)
    latest_report = _latest_report(owner)
    latest_prescription = _latest_prescription(owner)
    alerts = _ranked_alerts(owner)
    suggestions = _suggestions(owner, profile, latest_report, latest_prescription, alerts)
    upcoming_reminders = _upcoming_reminders(owner)
    timeline = _recent_timeline(owner)
    trend_alerts = _trend_alerts(owner)

    return {
        "profile": profile,
        "health_score": latest_report.get("health_score"),
        "health_status": latest_report.get("health_status", "unknown"),
        "latest_report": latest_report,
        "latest_prescription": latest_prescription,
        "trend_alerts": trend_alerts,
        "upcoming_reminders": upcoming_reminders,
        "alerts": alerts,
        "suggestions": suggestions,
        "timeline": timeline,
        "family_updates": [],
        "empty_states": {
            "family_updates": "Family Care Circle arrives in Phase 09.",
            "symptoms": "Symptoms and journal context arrive in Phase 08.",
        },
    }


def build_assistant_context(owner) -> dict:
    profile = getattr(owner, "health_profile", None)
    recent_reports = list(
        ReportAnalysis.objects.filter(owner=owner)
        .select_related("document")
        .order_by("-created_at")[:5]
    )
    current_medications = list(
        Medication.objects.filter(owner=owner)
        .select_related("analysis")
        .prefetch_related("schedules", "warnings")
        .order_by("brand_name")[:10]
    )
    symptoms = list(SymptomLog.objects.filter(owner=owner).order_by("-started_at")[:10])
    journal_entries = list(JournalEntry.objects.filter(owner=owner).order_by("-entry_date", "-created_at")[:10])
    warnings = list(
        MedicationWarning.objects.filter(analysis__owner=owner)
        .select_related("medication")
        .order_by("-created_at")[:10]
    )
    trends = list(TrendInsight.objects.filter(owner=owner).order_by("label", "biomarker_name")[:10])

    return {
        "profile": _serialize_profile(profile),
        "allergies": _profile_relation(profile, "allergies", ["name", "reaction", "severity"]),
        "known_conditions": _profile_relation(profile, "known_conditions", ["name", "status"]),
        "family_history": _profile_relation(profile, "family_history", ["relation", "condition"]),
        "recent_reports": [
            {
                "id": report.id,
                "document_title": report.document.title,
                "health_score": report.health_score,
                "health_status": report.health_status,
                "key_findings": report.key_findings[:3],
            }
            for report in recent_reports
        ],
        "biomarker_trends": [
            {
                "biomarker": trend.biomarker_name,
                "label": trend.label,
                "latest_value": trend.latest_value,
                "unit": trend.unit,
                "risk_awareness": trend.risk_awareness[:2],
            }
            for trend in trends
        ],
        "current_medicines": [
            {
                "brand_name": medication.brand_name,
                "active_ingredient": medication.active_ingredient,
                "strength": medication.strength,
                "purpose": medication.purpose,
                "schedules": [
                    {
                        "dosage": schedule.dosage,
                        "frequency": schedule.frequency,
                        "timing": schedule.timing,
                    }
                    for schedule in medication.schedules.all()
                ],
            }
            for medication in current_medications
        ],
        "prescription_warnings": [
            {
                "title": warning.title,
                "severity": warning.severity,
                "type": warning.warning_type,
                "medicine": warning.medication.brand_name if warning.medication else None,
            }
            for warning in warnings
        ],
        "symptoms_and_journal": {
            "recent_symptoms": [
                {
                    "symptom": symptom.symptom,
                    "severity": symptom.severity,
                    "pain_level": symptom.pain_level,
                    "started_at": symptom.started_at,
                    "doctor_consultation_recommended": symptom.doctor_consultation_recommended,
                }
                for symptom in symptoms
            ],
            "recent_journal": [
                {
                    "entry_date": entry.entry_date,
                    "title": entry.title,
                    "mood": entry.mood,
                    "stress": entry.stress,
                    "sleep_hours": str(entry.sleep_hours) if entry.sleep_hours is not None else None,
                    "notes": entry.notes[:160],
                }
                for entry in journal_entries
            ],
        },
        "family_context": [],
        "assembled_at": timezone.now().isoformat(),
    }


def create_assistant_turn(owner, message: str, conversation_id: int | None = None) -> AssistantConversation:
    context = build_assistant_context(owner)
    conversation = _conversation_for(owner, conversation_id, context)
    AssistantMessage.objects.create(
        conversation=conversation,
        role=AssistantMessage.Role.USER,
        content=message,
    )
    safety_flags = _safety_flags(message)
    response = _mock_response(message, context, safety_flags)
    AssistantMessage.objects.create(
        conversation=conversation,
        role=AssistantMessage.Role.ASSISTANT,
        content=response,
        safety_flags=safety_flags,
        cited_context={
            "reports_used": len(context["recent_reports"]),
            "medicines_used": len(context["current_medicines"]),
            "trends_used": len(context["biomarker_trends"]),
            "warnings_used": len(context["prescription_warnings"]),
        },
    )
    conversation.context_snapshot = context
    conversation.safety_review_required = bool(safety_flags)
    conversation.safety_review_notes = _safety_notes(safety_flags)
    conversation.save(
        update_fields=[
            "context_snapshot",
            "safety_review_required",
            "safety_review_notes",
            "updated_at",
        ]
    )
    return conversation


def _conversation_for(owner, conversation_id: int | None, context: dict) -> AssistantConversation:
    if conversation_id:
        return AssistantConversation.objects.get(owner=owner, id=conversation_id)
    return AssistantConversation.objects.create(
        owner=owner,
        context_snapshot=context,
        model_name=GEMINI_MODULES["health_assistant"].model,
        prompt_version=PROMPT_VERSION,
    )


def _mock_response(message: str, context: dict, safety_flags: list[str]) -> str:
    report_count = len(context["recent_reports"])
    medicine_count = len(context["current_medicines"])
    trend_count = len(context["biomarker_trends"])
    warning_count = len(context["prescription_warnings"])
    parts = [
        "I reviewed your MedClaro context and can help you prepare safer next questions.",
        f"I see {report_count} recent report(s), {trend_count} trend item(s), {medicine_count} medicine(s), and {warning_count} prescription warning(s).",
    ]
    if context["biomarker_trends"]:
        first_trend = context["biomarker_trends"][0]
        parts.append(
            f"One trend to discuss is {first_trend['biomarker']} marked {first_trend['label']}."
        )
    if context["prescription_warnings"]:
        warning = context["prescription_warnings"][0]
        parts.append(
            f"Medication safety note: {warning['title']} is marked {warning['severity']}."
        )
    if safety_flags:
        parts.append(
            "Because your question may be sensitive or urgent, please contact a qualified clinician or local emergency service for real-time medical decisions."
        )
    else:
        parts.append(
            "This is educational guidance, not a diagnosis. Use it to organize a conversation with your doctor."
        )
    return " ".join(parts)


def _safety_flags(message: str) -> list[str]:
    lowered = message.lower()
    return sorted(term for term in SENSITIVE_TERMS if term in lowered)


def _safety_notes(flags: list[str]) -> list[str]:
    if not flags:
        return []
    return [
        "Sensitive medical intent detected.",
        "Assistant response avoided diagnosis and directed user toward qualified care.",
    ]


def _profile_summary(owner) -> dict:
    profile = getattr(owner, "health_profile", None)
    if not profile:
        return {"exists": False, "completion_percentage": 0}
    return {
        "exists": True,
        "completion_percentage": profile.completion_percentage,
        "age": profile.age,
        "gender": profile.gender,
        "privacy_consent": profile.privacy_consent,
        "allergy_count": profile.allergies.count(),
        "condition_count": profile.known_conditions.count(),
    }


def _serialize_profile(profile: HealthProfile | None) -> dict:
    if not profile:
        return {"exists": False}
    return {
        "exists": True,
        "age": profile.age,
        "gender": profile.gender,
        "blood_group": profile.blood_group,
        "smoking": profile.smoking,
        "alcohol": profile.alcohol,
        "exercise": profile.exercise,
        "sleep_hours": str(profile.sleep_hours) if profile.sleep_hours is not None else None,
        "pregnancy_status": profile.pregnancy_status,
        "preferred_language": profile.preferred_language,
        "privacy_consent": profile.privacy_consent,
    }


def _profile_relation(profile, relation: str, fields: list[str]) -> list[dict]:
    if not profile:
        return []
    return [
        {field: getattr(item, field) for field in fields}
        for item in getattr(profile, relation).all()
    ]


def _latest_report(owner) -> dict:
    report = (
        ReportAnalysis.objects.filter(owner=owner)
        .select_related("document")
        .order_by("-created_at")
        .first()
    )
    if not report:
        return {}
    return {
        "id": report.id,
        "document_title": report.document.title,
        "health_score": report.health_score,
        "health_status": report.health_status,
        "key_findings": report.key_findings[:3],
        "created_at": report.created_at,
    }


def _latest_prescription(owner) -> dict:
    prescription = (
        PrescriptionAnalysis.objects.filter(owner=owner)
        .select_related("document")
        .annotate(medication_count=Count("medications"))
        .order_by("-created_at")
        .first()
    )
    if not prescription:
        return {}
    return {
        "id": prescription.id,
        "document_title": prescription.document.title,
        "medication_count": prescription.medication_count,
        "warning_count": prescription.medication_warnings.count(),
        "is_expired": prescription.is_expired,
        "created_at": prescription.created_at,
    }


def _trend_alerts(owner) -> list[dict]:
    return [
        {
            "id": trend.id,
            "biomarker": trend.biomarker_name,
            "label": trend.label,
            "latest_value": trend.latest_value,
            "unit": trend.unit,
            "doctor_prompts": trend.doctor_prompts[:2],
        }
        for trend in TrendInsight.objects.filter(
            owner=owner,
            label__in=[
                TrendInsight.TrendLabel.WORSENING,
                TrendInsight.TrendLabel.FLUCTUATING,
            ],
        ).order_by("label", "biomarker_name")[:5]
    ]


def _upcoming_reminders(owner) -> list[dict]:
    schedules = (
        MedicationSchedule.objects.filter(
            medication__owner=owner,
            reminder_status__in=[
                MedicationSchedule.ReminderStatus.PLANNED,
                MedicationSchedule.ReminderStatus.ACTIVE,
            ],
        )
        .select_related("medication")
        .order_by("end_date", "id")[:5]
    )
    return [
        {
            "id": schedule.id,
            "medicine": schedule.medication.brand_name,
            "dosage": schedule.dosage,
            "frequency": schedule.frequency,
            "timing": schedule.timing,
            "reminder_status": schedule.reminder_status,
        }
        for schedule in schedules
    ]


def _recent_timeline(owner) -> list[dict]:
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "title": event.title,
            "summary": event.summary,
            "event_date": event.event_date,
            "tags": event.tags[:6],
        }
        for event in TimelineEvent.objects.filter(owner=owner).order_by("-event_date", "-created_at")[:8]
    ]


def _ranked_alerts(owner) -> list[dict]:
    alerts = []
    for warning in MedicationWarning.objects.filter(
        analysis__owner=owner,
        severity__in=[
            MedicationWarning.Severity.CRITICAL,
            MedicationWarning.Severity.HIGH,
            MedicationWarning.Severity.MODERATE,
        ],
    ).order_by("-created_at")[:5]:
        alerts.append(
            {
                "priority": _severity_priority(warning.severity),
                "kind": "prescription_warning",
                "title": warning.title,
                "summary": warning.message,
                "severity": warning.severity,
            }
        )
    for trend in TrendInsight.objects.filter(
        owner=owner,
        label__in=[
            TrendInsight.TrendLabel.WORSENING,
            TrendInsight.TrendLabel.FLUCTUATING,
        ],
    )[:5]:
        alerts.append(
            {
                "priority": 3 if trend.label == TrendInsight.TrendLabel.WORSENING else 2,
                "kind": "trend",
                "title": f"{trend.biomarker_name} trend",
                "summary": f"Trend label: {trend.label.replace('_', ' ')}.",
                "severity": trend.label,
            }
        )
    return sorted(alerts, key=lambda item: item["priority"], reverse=True)[:6]


def _suggestions(owner, profile: dict, latest_report: dict, latest_prescription: dict, alerts: list[dict]) -> list[dict]:
    suggestions = []
    if not profile.get("exists"):
        suggestions.append(
            {
                "title": "Complete your health profile",
                "reason": "The assistant works better with age, allergies, conditions, and consent settings.",
                "action": "/profile",
            }
        )
    if latest_report:
        suggestions.append(
            {
                "title": "Review latest report findings",
                "reason": "Recent biomarkers can guide doctor discussion prompts.",
                "action": "/reports",
            }
        )
    if latest_prescription:
        suggestions.append(
            {
                "title": "Check prescription warnings",
                "reason": "Medication safety prompts can change with allergies and duplicate ingredients.",
                "action": "/prescriptions",
            }
        )
    if alerts:
        suggestions.append(
            {
                "title": "Ask the assistant to summarize top alerts",
                "reason": "The assistant can organize trend and medication prompts into a concise agenda.",
                "action": "/hub",
            }
        )
    return suggestions[:5]


def _severity_priority(severity: str) -> int:
    return {
        MedicationWarning.Severity.CRITICAL: 5,
        MedicationWarning.Severity.HIGH: 4,
        MedicationWarning.Severity.MODERATE: 3,
        MedicationWarning.Severity.LOW: 2,
        MedicationWarning.Severity.INFO: 1,
    }.get(severity, 0)
