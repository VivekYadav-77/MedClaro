from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from ai_services.gemini_config import GEMINI_MODULES
from documents.models import MedicalDocument
from health_profiles.models import Allergy
from health_trends.models import TimelineEvent

from .models import (
    Medication,
    MedicationSchedule,
    MedicationWarning,
    PrescriptionAnalysis,
)


PROMPT_VERSION = "prescription-analysis-v1"


@dataclass(frozen=True)
class MedicationFixture:
    brand_name: str
    active_ingredient: str
    strength: str
    dosage: str
    frequency: str
    timing: list[str]
    purpose: str
    usage_guidance: str
    side_effects: list[str]
    food_warnings: list[str]
    alcohol_warning: str
    driving_warning: str


MOCK_MEDICATIONS = [
    MedicationFixture(
        brand_name="Amoxil",
        active_ingredient="Amoxicillin",
        strength="500 mg",
        dosage="1 capsule",
        frequency="Twice daily for 5 days",
        timing=["morning", "night"],
        purpose="Antibiotic commonly prescribed for bacterial infections.",
        usage_guidance="Take at evenly spaced times and complete the course unless your doctor changes it.",
        side_effects=["Nausea", "Loose stools", "Rash"],
        food_warnings=["Can be taken with food if stomach upset occurs."],
        alcohol_warning="Avoid alcohol if it worsens stomach upset or dizziness.",
        driving_warning="Avoid driving if you feel dizzy or unwell.",
    ),
    MedicationFixture(
        brand_name="Crocin",
        active_ingredient="Paracetamol",
        strength="650 mg",
        dosage="1 tablet",
        frequency="As needed for fever or pain, max 3 doses daily",
        timing=["as_needed"],
        purpose="Helps reduce fever and mild to moderate pain.",
        usage_guidance="Do not exceed the prescribed daily dose or combine with other paracetamol products.",
        side_effects=["Nausea", "Rare allergic rash"],
        food_warnings=["Avoid taking multiple cold/flu products with paracetamol."],
        alcohol_warning="Avoid alcohol because it can increase liver risk with paracetamol.",
        driving_warning="Usually non-drowsy, but avoid driving if you feel unwell.",
    ),
]


def run_prescription_analysis(document: MedicalDocument, owner) -> PrescriptionAnalysis:
    analysis = PrescriptionAnalysis.objects.create(
        owner=owner,
        document=document,
        status=PrescriptionAnalysis.ProcessingStatus.PROCESSING,
        model_name=GEMINI_MODULES["prescription"].model,
        prompt_version=PROMPT_VERSION,
        source_document_reference=document.original_filename,
    )
    return complete_mock_prescription_analysis(analysis)


@transaction.atomic
def complete_mock_prescription_analysis(analysis: PrescriptionAnalysis) -> PrescriptionAnalysis:
    today = timezone.now().date()
    prescription_date = analysis.document.source_date or today
    expiry_date = prescription_date + timedelta(days=30)
    analysis.prescribed_by = "Mock extracted clinician"
    analysis.prescription_date = prescription_date
    analysis.expiry_date = expiry_date
    analysis.is_expired = expiry_date < today
    analysis.summary = (
        "Mock prescription analysis extracted medicines, schedules, common precautions, "
        "and safety discussion prompts."
    )
    analysis.analysis_payload = {
        "schema_version": "2026-07-11",
        "model": analysis.model_name,
        "prompt_version": PROMPT_VERSION,
        "source_document_id": analysis.document_id,
        "source_document_filename": analysis.source_document_reference,
        "interaction_severity_categories": ["info", "low", "moderate", "high", "critical"],
    }
    analysis.completed_at = timezone.now()
    analysis.status = PrescriptionAnalysis.ProcessingStatus.COMPLETED
    analysis.save()

    analysis.medications.all().delete()
    for index, item in enumerate(MOCK_MEDICATIONS, start=1):
        medication = Medication.objects.create(
            owner=analysis.owner,
            analysis=analysis,
            brand_name=item.brand_name,
            active_ingredient=item.active_ingredient,
            strength=item.strength,
            purpose=item.purpose,
            usage_guidance=item.usage_guidance,
            side_effects=item.side_effects,
            food_warnings=item.food_warnings,
            alcohol_warning=item.alcohol_warning,
            driving_warning=item.driving_warning,
            pregnancy_breastfeeding_note=(
                "Ask a clinician before use during pregnancy or breastfeeding."
            ),
            duplicate_key=_normalize_duplicate_key(item.active_ingredient),
            sort_order=index,
        )
        MedicationSchedule.objects.create(
            medication=medication,
            dosage=item.dosage,
            frequency=item.frequency,
            timing=item.timing,
            start_date=prescription_date,
            end_date=expiry_date,
            reminder_status=MedicationSchedule.ReminderStatus.PLANNED,
            notification_plan={
                "enabled": False,
                "channels": [],
                "timezone": "user_profile_or_device",
                "planning_note": "Notification delivery is planned for a later phase.",
            },
            instructions=item.usage_guidance,
        )
        _create_common_warnings(analysis, medication, item)

    _create_duplicate_warnings(analysis)
    _create_interaction_warnings(analysis)
    _create_allergy_warnings(analysis)
    if analysis.is_expired:
        MedicationWarning.objects.create(
            analysis=analysis,
            warning_type=MedicationWarning.WarningType.EXPIRED,
            severity=MedicationWarning.Severity.MODERATE,
            title="Prescription may be expired",
            message="This prescription appears older than the default 30-day review window.",
            action_prompt="Confirm with your doctor before using medicines from an old prescription.",
        )

    high_risk = analysis.medication_warnings.filter(
        severity__in=[
            MedicationWarning.Severity.HIGH,
            MedicationWarning.Severity.CRITICAL,
        ]
    ).exists()
    analysis.safety_review_required = high_risk
    analysis.safety_review_notes = _safety_notes(analysis)
    analysis.warnings = [
        {
            "type": warning.warning_type,
            "severity": warning.severity,
            "title": warning.title,
            "message": warning.message,
        }
        for warning in analysis.medication_warnings.all()
    ]
    analysis.save(update_fields=["safety_review_required", "safety_review_notes", "warnings", "updated_at"])

    analysis.document.status = MedicalDocument.ProcessingStatus.ANALYZED
    analysis.document.analysis_handoff = {
        **analysis.document.analysis_handoff,
        "ready_for": "prescription_analysis",
        "status": "analyzed",
        "latest_prescription_analysis_id": analysis.id,
    }
    analysis.document.save(update_fields=["status", "analysis_handoff", "updated_at"])
    _upsert_timeline_event(analysis)
    return analysis


def _create_common_warnings(
    analysis: PrescriptionAnalysis,
    medication: Medication,
    item: MedicationFixture,
) -> None:
    if item.alcohol_warning:
        MedicationWarning.objects.create(
            analysis=analysis,
            medication=medication,
            warning_type=MedicationWarning.WarningType.ALCOHOL,
            severity=MedicationWarning.Severity.LOW,
            title=f"Alcohol caution for {medication.brand_name}",
            message=item.alcohol_warning,
            action_prompt="Ask a pharmacist or doctor if alcohol is safe with this medicine.",
        )
    if item.driving_warning:
        MedicationWarning.objects.create(
            analysis=analysis,
            medication=medication,
            warning_type=MedicationWarning.WarningType.DRIVING,
            severity=MedicationWarning.Severity.INFO,
            title=f"Driving caution for {medication.brand_name}",
            message=item.driving_warning,
            action_prompt="Avoid driving if symptoms or side effects affect alertness.",
        )


def _create_duplicate_warnings(analysis: PrescriptionAnalysis) -> None:
    seen = {}
    for medication in analysis.medications.all():
        if medication.duplicate_key in seen:
            MedicationWarning.objects.create(
                analysis=analysis,
                medication=medication,
                warning_type=MedicationWarning.WarningType.DUPLICATE,
                severity=MedicationWarning.Severity.HIGH,
                title="Possible duplicate medicine",
                message=(
                    f"{medication.brand_name} may duplicate active ingredient "
                    f"{seen[medication.duplicate_key].brand_name}."
                ),
                action_prompt="Confirm duplicate therapy with a clinician before taking both.",
            )
        seen[medication.duplicate_key] = medication


def _create_interaction_warnings(analysis: PrescriptionAnalysis) -> None:
    ingredients = {
        medication.active_ingredient.lower(): medication
        for medication in analysis.medications.all()
    }
    if "paracetamol" in ingredients and "amoxicillin" in ingredients:
        MedicationWarning.objects.create(
            analysis=analysis,
            warning_type=MedicationWarning.WarningType.INTERACTION,
            severity=MedicationWarning.Severity.INFO,
            title="No major mock interaction detected",
            message=(
                "The mocked checker did not flag a major interaction between amoxicillin "
                "and paracetamol, but real checks must use clinician-reviewed data."
            ),
            action_prompt="Review all medicines and supplements with your doctor or pharmacist.",
        )


def _create_allergy_warnings(analysis: PrescriptionAnalysis) -> None:
    profile = getattr(analysis.owner, "health_profile", None)
    if not profile:
        return

    allergy_names = [
        allergy.name.lower()
        for allergy in Allergy.objects.filter(profile=profile)
    ]
    for medication in analysis.medications.all():
        ingredient = medication.active_ingredient.lower()
        if any(allergy in ingredient or ingredient in allergy for allergy in allergy_names):
            MedicationWarning.objects.create(
                analysis=analysis,
                medication=medication,
                warning_type=MedicationWarning.WarningType.ALLERGY,
                severity=MedicationWarning.Severity.CRITICAL,
                title=f"Possible allergy match for {medication.brand_name}",
                message=(
                    f"Your profile includes an allergy that may match {medication.active_ingredient}."
                ),
                action_prompt="Do not start this medicine until a clinician confirms it is safe.",
            )


def _safety_notes(analysis: PrescriptionAnalysis) -> list[str]:
    notes = [
        "Medication guidance is educational and does not replace a clinician or pharmacist.",
        "Warnings are framed as review prompts, not final safety decisions.",
    ]
    if analysis.safety_review_required:
        notes.append("High-risk medication warning triggered safety review metadata.")
    return notes


def _upsert_timeline_event(analysis: PrescriptionAnalysis) -> None:
    event_date = analysis.prescription_date or analysis.created_at.date()
    TimelineEvent.objects.update_or_create(
        owner=analysis.owner,
        source_type="prescription_analysis",
        source_id=analysis.id,
        event_type=TimelineEvent.EventType.PRESCRIPTION,
        defaults={
            "title": analysis.document.title,
            "summary": (
                f"{analysis.medications.count()} medicines extracted; "
                f"{analysis.medication_warnings.count()} safety notes."
            ),
            "event_date": event_date,
            "tags": [
                "prescription",
                *list(analysis.medications.values_list("brand_name", flat=True)),
                *list(analysis.medications.values_list("active_ingredient", flat=True)),
            ],
            "metadata": {
                "document_id": analysis.document_id,
                "medication_count": analysis.medications.count(),
                "warning_count": analysis.medication_warnings.count(),
                "is_expired": analysis.is_expired,
            },
        },
    )


def _normalize_duplicate_key(value: str) -> str:
    return "".join(character for character in value.lower() if character.isalnum())
