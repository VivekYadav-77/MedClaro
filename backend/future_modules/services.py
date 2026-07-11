from django.utils import timezone

from ai_services.gemini_config import GEMINI_MODULES

from .models import (
    FutureModuleRoadmap,
    HealthEducationContent,
    PartnerIntegrationBoundary,
    SecondOpinionRequest,
    VaccinationRecord,
    WearableIntegrationPlan,
)


SECOND_OPINION_PROMPT_VERSION = "second-opinion-safety-v1"

ROADMAP_BLUEPRINT = [
    {
        "module_key": FutureModuleRoadmap.ModuleKey.VACCINATION,
        "priority": FutureModuleRoadmap.Priority.NOW,
        "status": FutureModuleRoadmap.Status.DESIGN_READY,
        "user_value": "Prevent missed vaccines and connect certificates to the Medical Vault.",
        "dependencies": ["health_profile", "timeline_events", "document_vault"],
        "profile_connections": ["age", "known_conditions", "pregnancy_status", "family_members"],
        "timeline_event_types": ["vaccination_given", "vaccination_due"],
        "release_notes": ["Reminder-only in first release; no clinical schedule automation without review."],
    },
    {
        "module_key": FutureModuleRoadmap.ModuleKey.WOMENS_HEALTH,
        "priority": FutureModuleRoadmap.Priority.NOW,
        "status": FutureModuleRoadmap.Status.DESIGN_READY,
        "user_value": "Track cycles, pregnancy context, PCOS, menopause, iron, and calcium patterns.",
        "dependencies": ["health_profile", "daily_health", "report_analysis"],
        "profile_connections": ["gender", "pregnancy_status", "age", "biomarker_results"],
        "timeline_event_types": ["period", "pregnancy_note", "iron_calcium_review"],
        "release_notes": ["Educational prompts only; fertility and pregnancy decisions require clinician guidance."],
    },
    {
        "module_key": FutureModuleRoadmap.ModuleKey.CHILD_GROWTH,
        "priority": FutureModuleRoadmap.Priority.NOW,
        "status": FutureModuleRoadmap.Status.DESIGN_READY,
        "user_value": "Help families organize child growth measurements and pediatric discussion prompts.",
        "dependencies": ["family_care", "health_profile", "timeline_events"],
        "profile_connections": ["family_role", "child_profile", "vaccination_records"],
        "timeline_event_types": ["growth_measurement", "pediatric_visit"],
        "release_notes": ["Percentile interpretation stays as doctor discussion support, not diagnosis."],
    },
    {
        "module_key": FutureModuleRoadmap.ModuleKey.INSURANCE,
        "priority": FutureModuleRoadmap.Priority.NEXT,
        "status": FutureModuleRoadmap.Status.DESIGN_READY,
        "user_value": "Keep insurance cards, invoices, bills, and claim details accessible during care.",
        "dependencies": ["document_vault", "emergency_profile", "permission_model"],
        "profile_connections": ["emergency_contacts", "family_permissions"],
        "timeline_event_types": ["policy_added", "claim_document_added"],
        "release_notes": ["Emergency profile may expose only explicitly approved insurance fields."],
    },
    {
        "module_key": FutureModuleRoadmap.ModuleKey.SECOND_OPINION,
        "priority": FutureModuleRoadmap.Priority.NEXT,
        "status": FutureModuleRoadmap.Status.DESIGN_READY,
        "user_value": "Organize reports, findings, missing tests, and questions before seeking another doctor.",
        "dependencies": ["report_analysis", "timeline_events", "ai_safety_framework"],
        "profile_connections": ["conditions", "allergies", "medications", "recent_reports"],
        "timeline_event_types": ["second_opinion_packet"],
        "release_notes": ["AI must never recommend changing treatment without a qualified clinician."],
    },
    {
        "module_key": FutureModuleRoadmap.ModuleKey.WEARABLES,
        "priority": FutureModuleRoadmap.Priority.LATER,
        "status": FutureModuleRoadmap.Status.PLANNED,
        "user_value": "Bring steps, sleep, heart rate, oxygen, weight, and activity into longitudinal context.",
        "dependencies": ["consent_scopes", "partner_availability", "timeline_events"],
        "profile_connections": ["activity_level", "sleep_hours", "weight"],
        "timeline_event_types": ["wearable_sync", "activity_summary"],
        "release_notes": ["Raw wearable data should be summarized before assistant context use."],
    },
]

EDUCATION_BLUEPRINT = [
    {
        "title": "Understanding HbA1c",
        "content_type": HealthEducationContent.ContentType.BIOMARKER,
        "audience": "preventive_health",
        "summary": "Explains what HbA1c reflects and which doctor questions to ask about long-term sugar control.",
        "tags": ["blood sugar", "diabetes", "preventive"],
        "related_profile_fields": ["age", "family_history", "biomarker_results"],
    },
    {
        "title": "Iron, Calcium, And Fatigue",
        "content_type": HealthEducationContent.ContentType.ARTICLE,
        "audience": "womens_health",
        "summary": "Connects common nutrition markers with symptoms and report discussion prompts.",
        "tags": ["iron", "calcium", "fatigue"],
        "related_profile_fields": ["gender", "pregnancy_status", "biomarker_results"],
    },
    {
        "title": "Walking Plan Basics",
        "content_type": HealthEducationContent.ContentType.EXERCISE,
        "audience": "general",
        "summary": "A gentle education item for discussing activity goals and wearable step trends.",
        "tags": ["fitness", "steps", "heart health"],
        "related_profile_fields": ["exercise", "weight", "known_conditions"],
    },
]

INTEGRATION_BLUEPRINT = [
    {
        "partner_type": PartnerIntegrationBoundary.PartnerType.HOSPITAL,
        "inbound_data": ["visit summaries", "lab orders", "discharge summaries"],
        "outbound_data": ["doctor summary", "selected reports", "emergency profile"],
        "permission_boundary": "Share only user-selected records or doctor-mode packets with explicit consent.",
        "audit_events": ["hospital_connected", "record_shared", "consent_revoked"],
    },
    {
        "partner_type": PartnerIntegrationBoundary.PartnerType.PHARMACY,
        "inbound_data": ["dispensed medicines", "refill status", "invoice"],
        "outbound_data": ["active prescription", "allergy warnings"],
        "permission_boundary": "Never share full health timeline with pharmacies; use medication-specific consent.",
        "audit_events": ["pharmacy_connected", "prescription_shared", "refill_imported"],
    },
    {
        "partner_type": PartnerIntegrationBoundary.PartnerType.APPOINTMENT,
        "inbound_data": ["appointment date", "doctor specialty", "visit reason"],
        "outbound_data": ["prepared questions", "doctor summary"],
        "permission_boundary": "Appointment systems receive scheduling context, not full medical history by default.",
        "audit_events": ["appointment_created", "doctor_packet_attached"],
    },
    {
        "partner_type": PartnerIntegrationBoundary.PartnerType.INSURANCE,
        "inbound_data": ["policy metadata", "claim status", "cashless eligibility"],
        "outbound_data": ["claim documents", "bills", "selected invoices"],
        "permission_boundary": "Insurance sharing is document-scoped and separate from family or doctor permissions.",
        "audit_events": ["policy_linked", "claim_document_shared", "claim_status_imported"],
    },
]


def ensure_roadmap(owner) -> list[FutureModuleRoadmap]:
    records = []
    for item in ROADMAP_BLUEPRINT:
        record, _created = FutureModuleRoadmap.objects.update_or_create(
            owner=owner,
            module_key=item["module_key"],
            defaults=item,
        )
        records.append(record)
    return records


def build_ecosystem_strategy(owner) -> dict:
    roadmap = ensure_roadmap(owner)
    return {
        "roadmap": [
            {
                "module_key": item.module_key,
                "priority": item.priority,
                "status": item.status,
                "user_value": item.user_value,
                "dependencies": item.dependencies,
                "profile_connections": item.profile_connections,
                "timeline_event_types": item.timeline_event_types,
            }
            for item in roadmap
        ],
        "data_extension_strategy": {
            "principle": "Future modules extend profile, vault, timeline, and permissions without replacing core records.",
            "profile_anchor": "Store module-owned records with owner scope and summarize only bounded context into AI prompts.",
            "timeline_anchor": "Convert major user-visible events into timeline entries after event-type expansion.",
            "vault_anchor": [
                "mri",
                "ct",
                "invoice",
                "bill",
                "insurance_document",
                "vaccination_certificate",
            ],
        },
        "health_education_strategy": {
            "content_types": ["biomarker", "condition", "food", "exercise", "video", "article"],
            "review_policy": "Medical review is required before production education content is recommended.",
            "personalization": "Match tags to profile fields, biomarkers, medicines, symptoms, and language preferences.",
        },
        "advanced_ai_safety": second_opinion_safety_language(),
    }


def vaccination_reminder_rules(record: VaccinationRecord) -> list[str]:
    if not record.next_due_on:
        return ["No due date set; keep certificate linked in the Medical Vault."]
    today = timezone.localdate()
    days_until_due = (record.next_due_on - today).days
    if days_until_due < 0:
        return ["Dose appears overdue; discuss catch-up timing with a qualified clinician."]
    if days_until_due <= 30:
        return ["Dose due within 30 days; show reminder in Health Hub and Timeline."]
    return ["Schedule a reminder 30 days before due date and again 7 days before due date."]


def second_opinion_safety_language() -> dict:
    return {
        "model": GEMINI_MODULES["safety_review"].model,
        "prompt_version": SECOND_OPINION_PROMPT_VERSION,
        "rules": [
            "Frame output as preparation for a qualified doctor, not a diagnosis.",
            "Separate extracted findings from suggested discussion points.",
            "Do not recommend stopping, starting, or changing treatment.",
            "Escalate urgent symptoms toward emergency care instead of second-opinion planning.",
        ],
        "sections": [
            "discussion_points",
            "questions_to_ask",
            "relevant_findings",
            "missing_tests_to_discuss",
        ],
    }


def create_second_opinion(owner, data: dict) -> SecondOpinionRequest:
    concern = data["concern"]
    safety = second_opinion_safety_language()
    return SecondOpinionRequest.objects.create(
        owner=owner,
        concern=concern,
        related_document_ids=data.get("related_document_ids", []),
        related_timeline_event_ids=data.get("related_timeline_event_ids", []),
        discussion_points=[
            "Ask the doctor to review whether the current findings fit together clinically.",
            "Confirm which symptoms, medicines, and report dates are most important.",
        ],
        questions_to_ask=[
            "What are the likely next steps to clarify this concern?",
            "Are there warning signs that should prompt urgent care?",
        ],
        relevant_findings=[
            "Use uploaded reports, prescriptions, and timeline events as source facts.",
            f"User concern summary: {concern[:160]}",
        ],
        missing_tests_to_discuss=[
            "Ask whether any repeat, imaging, or specialist tests are appropriate.",
            "Do not order tests based only on AI output.",
        ],
        safety_language=safety["rules"],
        status=SecondOpinionRequest.Status.READY_FOR_DOCTOR,
        model_name=GEMINI_MODULES["safety_review"].model,
        prompt_version=SECOND_OPINION_PROMPT_VERSION,
    )


def ensure_health_education_content() -> list[HealthEducationContent]:
    records = []
    for item in EDUCATION_BLUEPRINT:
        record, _created = HealthEducationContent.objects.update_or_create(
            title=item["title"],
            defaults=item,
        )
        records.append(record)
    return records


def ensure_integration_boundaries() -> list[PartnerIntegrationBoundary]:
    records = []
    for item in INTEGRATION_BLUEPRINT:
        record, _created = PartnerIntegrationBoundary.objects.update_or_create(
            partner_type=item["partner_type"],
            defaults=item,
        )
        records.append(record)
    return records


def build_wearable_metric_plan(owner) -> dict:
    plans = list(WearableIntegrationPlan.objects.filter(owner=owner))
    return {
        "supported_metrics": ["steps", "sleep", "heart_rate", "oxygen", "weight", "activity"],
        "consent_scopes": ["read_daily_summary", "read_sleep_summary", "read_vitals_summary"],
        "timeline_policy": "Store daily summaries and unusual changes as timeline-ready events after consent.",
        "assistant_policy": "Use aggregated trends only; avoid raw minute-level wearable data in AI context.",
        "connected_plans": [
            {
                "provider": plan.provider,
                "metrics": plan.metrics,
                "sync_frequency": plan.sync_frequency,
                "last_sync_status": plan.last_sync_status,
            }
            for plan in plans
        ],
    }
