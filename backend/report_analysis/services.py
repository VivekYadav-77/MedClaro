from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone

from ai_services.gemini_config import GEMINI_MODULES
from documents.models import MedicalDocument

from .models import BiomarkerResult, ReportAnalysis


PROMPT_VERSION = "report-analysis-v1"
DISCLAIMER = (
    "This AI report analysis is educational support and is not a diagnosis. "
    "Use it to prepare questions for a qualified clinician, especially for "
    "abnormal, worsening, or urgent symptoms."
)


@dataclass(frozen=True)
class BiomarkerFixture:
    name: str
    code: str
    value: str
    unit: str
    normal_range: str
    status: str
    severity: int
    summary: str
    recommendations: list[str]


MOCK_BIOMARKERS = [
    BiomarkerFixture(
        name="Hemoglobin",
        code="HGB",
        value="12.4",
        unit="g/dL",
        normal_range="12.0-15.5 g/dL",
        status=BiomarkerResult.MarkerStatus.NORMAL,
        severity=0,
        summary="Within the expected range for many adult reference intervals.",
        recommendations=["Keep a balanced iron, folate, and B12 intake."],
    ),
    BiomarkerFixture(
        name="LDL Cholesterol",
        code="LDL",
        value="154",
        unit="mg/dL",
        normal_range="<100 mg/dL",
        status=BiomarkerResult.MarkerStatus.HIGH,
        severity=2,
        summary="Higher than the usual target range and worth discussing with a doctor.",
        recommendations=[
            "Prioritize soluble fiber, nuts, legumes, and unsaturated fats.",
            "Ask your doctor whether repeat testing or medication review is needed.",
        ],
    ),
    BiomarkerFixture(
        name="Fasting Glucose",
        code="FPG",
        value="112",
        unit="mg/dL",
        normal_range="70-99 mg/dL",
        status=BiomarkerResult.MarkerStatus.HIGH,
        severity=1,
        summary="Mildly above the typical fasting range.",
        recommendations=[
            "Review meal timing, sleep, activity, and family history with your clinician.",
            "Consider asking whether HbA1c testing is appropriate.",
        ],
    ),
]


def run_report_analysis(document: MedicalDocument, owner) -> ReportAnalysis:
    analysis = ReportAnalysis.objects.create(
        owner=owner,
        document=document,
        status=ReportAnalysis.ProcessingStatus.PROCESSING,
        model_name=GEMINI_MODULES["report_analysis"].model,
        prompt_version=PROMPT_VERSION,
        source_document_reference=document.original_filename,
        disclaimer=DISCLAIMER,
    )
    return complete_mock_analysis(analysis)


@transaction.atomic
def complete_mock_analysis(analysis: ReportAnalysis) -> ReportAnalysis:
    critical_markers = [item for item in MOCK_BIOMARKERS if item.severity >= 3]
    high_markers = [item for item in MOCK_BIOMARKERS if item.severity >= 2]
    health_score = _score_from_markers(MOCK_BIOMARKERS)
    health_status = _status_from_markers(MOCK_BIOMARKERS)
    safety_required = bool(critical_markers or high_markers)

    analysis.health_score = health_score
    analysis.health_status = health_status
    analysis.status = ReportAnalysis.ProcessingStatus.COMPLETED
    analysis.key_findings = [
        "Mock analysis extracted 3 biomarkers from the selected lab report.",
        "LDL cholesterol is above the usual target range.",
        "Fasting glucose is mildly elevated and may benefit from follow-up.",
    ]
    analysis.food_guidance = [
        "Choose high-fiber meals with vegetables, beans, oats, and whole grains.",
        "Limit sugary drinks and frequent ultra-processed snacks.",
        "Use unsaturated fats such as nuts, seeds, olive oil, and fish where suitable.",
    ]
    analysis.lifestyle_guidance = [
        "Aim for regular walking or other moderate activity if your doctor says it is safe.",
        "Track sleep and stress because both can affect glucose and cholesterol markers.",
    ]
    analysis.doctor_prompts = [
        "Should I repeat lipid and glucose testing, and when?",
        "Do my age, family history, and blood pressure change my LDL target?",
        "Would HbA1c or thyroid testing help interpret these results?",
    ]
    analysis.safety_review_required = safety_required
    analysis.safety_review_notes = _safety_notes(health_status, high_markers)
    analysis.analysis_payload = {
        "schema_version": "2026-07-11",
        "model": analysis.model_name,
        "prompt_version": PROMPT_VERSION,
        "source_document_id": analysis.document_id,
        "source_document_filename": analysis.source_document_reference,
        "explanation_levels": [
            "explain_to_grandma",
            "simple",
            "detailed",
            "medical_student",
            "doctor_mode",
        ],
    }
    analysis.completed_at = timezone.now()
    analysis.save()

    BiomarkerResult.objects.filter(analysis=analysis).delete()
    for index, biomarker in enumerate(MOCK_BIOMARKERS, start=1):
        BiomarkerResult.objects.create(
            analysis=analysis,
            name=biomarker.name,
            code=biomarker.code,
            value=biomarker.value,
            unit=biomarker.unit,
            normal_range=biomarker.normal_range,
            status=biomarker.status,
            severity=biomarker.severity,
            summary=biomarker.summary,
            explanations=_explanations_for(biomarker),
            recommendations=biomarker.recommendations,
            sort_order=index,
        )

    analysis.document.status = MedicalDocument.ProcessingStatus.ANALYZED
    analysis.document.analysis_handoff = {
        **analysis.document.analysis_handoff,
        "ready_for": "report_analysis",
        "status": "analyzed",
        "latest_report_analysis_id": analysis.id,
    }
    analysis.document.save(update_fields=["status", "analysis_handoff", "updated_at"])
    return analysis


def _score_from_markers(markers: list[BiomarkerFixture]) -> int:
    penalty = sum(item.severity * 10 for item in markers)
    return max(0, min(100, 100 - penalty))


def _status_from_markers(markers: list[BiomarkerFixture]) -> str:
    max_severity = max(item.severity for item in markers)
    if max_severity >= 3:
        return ReportAnalysis.HealthStatus.CRITICAL
    if max_severity >= 1:
        return ReportAnalysis.HealthStatus.NEEDS_ATTENTION
    return ReportAnalysis.HealthStatus.GOOD


def _safety_notes(health_status: str, high_markers: list[BiomarkerFixture]) -> list[str]:
    notes = [
        "Avoided diagnosis language and framed findings as discussion points.",
        "Included clinician follow-up prompts for abnormal markers.",
    ]
    if health_status == ReportAnalysis.HealthStatus.CRITICAL:
        notes.append("Critical status should advise urgent medical review.")
    elif high_markers:
        notes.append("High-risk abnormal markers triggered safety review metadata.")
    return notes


def _explanations_for(biomarker: BiomarkerFixture) -> dict:
    return {
        "explain_to_grandma": (
            f"{biomarker.name} is one clue about how your body is doing. "
            f"This result is marked {biomarker.status}."
        ),
        "simple": f"{biomarker.name} is {biomarker.value} {biomarker.unit}; expected range: {biomarker.normal_range}.",
        "detailed": biomarker.summary,
        "medical_student": (
            f"Interpret {biomarker.code or biomarker.name} against lab-specific reference "
            f"intervals, symptoms, medication history, and repeat testing trends."
        ),
        "doctor_mode": (
            f"{biomarker.name}: {biomarker.value} {biomarker.unit}, reference {biomarker.normal_range}, "
            f"AI status {biomarker.status}, severity {biomarker.severity}."
        ),
    }
