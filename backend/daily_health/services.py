from django.db.models import Q

from ai_services.gemini_config import GEMINI_MODULES
from health_profiles.models import HealthProfile
from health_trends.models import TimelineEvent, TrendInsight
from medication_intelligence.models import Medication
from report_analysis.models import ReportAnalysis

from .models import JournalEntry, LifestylePlan, SymptomLog


PROMPT_VERSION = "lifestyle-planner-v1"
URGENT_SYMPTOMS = {"chest pain", "trouble breathing", "fainting", "severe allergic reaction"}


def apply_symptom_safety(symptom_log: SymptomLog) -> SymptomLog:
    flags = []
    lowered = symptom_log.symptom.lower()
    if symptom_log.severity in {SymptomLog.Severity.SEVERE, SymptomLog.Severity.CRITICAL}:
        flags.append("Severe symptoms should be reviewed with a clinician.")
    if any(term in lowered for term in URGENT_SYMPTOMS):
        flags.append("Urgent symptom keyword detected; seek timely medical help.")
    if symptom_log.pain_level is not None and symptom_log.pain_level >= 8:
        flags.append("High pain score should not be self-managed without medical guidance.")

    symptom_log.doctor_consultation_recommended = bool(flags)
    symptom_log.safety_notes = flags
    symptom_log.save(update_fields=["doctor_consultation_recommended", "safety_notes", "updated_at"])
    upsert_symptom_timeline(symptom_log)
    return symptom_log


def upsert_symptom_timeline(symptom_log: SymptomLog) -> None:
    TimelineEvent.objects.update_or_create(
        owner=symptom_log.owner,
        source_type="symptom_log",
        source_id=symptom_log.id,
        event_type=TimelineEvent.EventType.SYMPTOM,
        defaults={
            "title": symptom_log.symptom,
            "summary": f"{symptom_log.severity} symptom logged. {symptom_log.notes[:120]}",
            "event_date": symptom_log.started_at.date(),
            "tags": ["symptom", symptom_log.symptom, symptom_log.severity, *symptom_log.triggers],
            "metadata": {
                "pain_level": symptom_log.pain_level,
                "doctor_consultation_recommended": symptom_log.doctor_consultation_recommended,
            },
        },
    )


def upsert_journal_timeline(entry: JournalEntry) -> None:
    TimelineEvent.objects.update_or_create(
        owner=entry.owner,
        source_type="journal_entry",
        source_id=entry.id,
        event_type=TimelineEvent.EventType.JOURNAL,
        defaults={
            "title": entry.title or "Daily health journal",
            "summary": _journal_summary(entry),
            "event_date": entry.entry_date,
            "tags": ["journal", *entry.tags],
            "metadata": {
                "mood": entry.mood,
                "stress": entry.stress,
                "sleep_hours": str(entry.sleep_hours) if entry.sleep_hours is not None else None,
                "energy": entry.energy,
                "pain": entry.pain,
                "fever_c": str(entry.fever_c) if entry.fever_c is not None else None,
                "systolic_bp": entry.systolic_bp,
                "diastolic_bp": entry.diastolic_bp,
                "blood_sugar_mg_dl": entry.blood_sugar_mg_dl,
                "pulse_bpm": entry.pulse_bpm,
                "water_ml": entry.water_ml,
            },
        },
    )


def generate_lifestyle_plan(owner, plan_type: str) -> LifestylePlan:
    context = build_lifestyle_context(owner)
    if plan_type == LifestylePlan.PlanType.EXERCISE:
        title = "Gentle weekly movement plan"
        summary = "A conservative activity plan based on available profile, trend, and medication context."
        recommendations = [
            "Aim for short walks or low-impact movement on most days if your doctor says it is safe.",
            "Add light mobility and stretching after long sitting periods.",
            "Track energy, pain, pulse, and symptoms in the journal after activity.",
        ]
        restrictions = [
            "Avoid high-intensity exercise during fever, chest pain, dizziness, or severe symptoms.",
            "Review activity limits with a clinician if you have known heart, lung, pregnancy, or injury concerns.",
        ]
    else:
        title = "Balanced food planning guide"
        summary = "A practical food plan using profile preferences, allergies, and report/trend context."
        recommendations = [
            "Build meals around vegetables, protein, whole grains, and healthy fats suited to your food preference.",
            "Keep hydration and meal timing consistent, then note energy and sugar readings in the journal.",
            "Use recent biomarker trends as doctor discussion context rather than self-diagnosis.",
        ]
        restrictions = [
            "Avoid foods that conflict with recorded allergies or medication warnings.",
            "Ask a clinician before restrictive diets, fasting, or supplement-heavy plans.",
        ]

    plan = LifestylePlan.objects.create(
        owner=owner,
        plan_type=plan_type,
        title=title,
        summary=summary,
        recommendations=recommendations,
        restrictions=restrictions,
        doctor_consultation_prompts=[
            "Are there symptoms or conditions that should limit diet or exercise changes?",
            "Do my recent reports or medicines require any specific precautions?",
        ],
        safety_notes=[
            "Lifestyle guidance is educational and should not replace medical care.",
            "Seek clinician advice for severe symptoms, pregnancy concerns, medication interactions, or major diet/exercise changes.",
        ],
        input_context=context,
        model_name=GEMINI_MODULES["diet_exercise"].model,
        prompt_version=PROMPT_VERSION,
    )
    return plan


def build_lifestyle_context(owner) -> dict:
    profile = getattr(owner, "health_profile", None)
    recent_report = ReportAnalysis.objects.filter(owner=owner).order_by("-created_at").first()
    trends = TrendInsight.objects.filter(owner=owner).order_by("label", "biomarker_name")[:5]
    medicines = Medication.objects.filter(owner=owner).order_by("brand_name")[:10]
    return {
        "profile": _profile_context(profile),
        "recent_report": {
            "health_score": recent_report.health_score,
            "health_status": recent_report.health_status,
            "key_findings": recent_report.key_findings[:3],
        }
        if recent_report
        else None,
        "trends": [
            {
                "biomarker": trend.biomarker_name,
                "label": trend.label,
                "latest_value": trend.latest_value,
                "unit": trend.unit,
            }
            for trend in trends
        ],
        "medications": [
            {
                "brand_name": medication.brand_name,
                "active_ingredient": medication.active_ingredient,
                "food_warnings": medication.food_warnings,
            }
            for medication in medicines
        ],
    }


def search_journal(owner, query: str):
    entries = JournalEntry.objects.filter(owner=owner)
    if query:
        entries = entries.filter(
            Q(title__icontains=query)
            | Q(notes__icontains=query)
            | Q(tags__icontains=query)
        )
    return entries


def _profile_context(profile: HealthProfile | None) -> dict:
    if not profile:
        return {"exists": False}
    return {
        "exists": True,
        "age": profile.age,
        "gender": profile.gender,
        "weight_kg": str(profile.weight_kg) if profile.weight_kg is not None else None,
        "food_preference": profile.food_preference,
        "location": profile.location,
        "pregnancy_status": profile.pregnancy_status,
        "allergies": list(profile.allergies.values_list("name", flat=True)),
        "known_conditions": list(profile.known_conditions.values_list("name", flat=True)),
    }


def _journal_summary(entry: JournalEntry) -> str:
    parts = []
    if entry.mood:
        parts.append(f"mood {entry.mood}/10")
    if entry.stress:
        parts.append(f"stress {entry.stress}/10")
    if entry.sleep_hours is not None:
        parts.append(f"sleep {entry.sleep_hours}h")
    if entry.notes:
        parts.append(entry.notes[:100])
    return "; ".join(parts) or "Daily health measurements logged."
