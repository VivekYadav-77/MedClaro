"""
Prescription Analysis Service
-------------------------------
Orchestrates the full medication risk workflow:
  1. Build patient health context from selected reports and active prescriptions.
  2. Run the deterministic risk engine.
  3. Send structured risks to Gemini for human-friendly explanation.
  4. Persist results in PrescriptionAnalysis and update PrescriptionRecord.

This module deliberately separates deterministic risk detection (risk_engine)
from AI explanation (Gemini) — Gemini is ONLY used to explain risks that were
already identified by the rule engine.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from reports.models import PrescriptionAnalysis, PrescriptionRecord, PrescriptionReportLink, Report
from reports.services import ReportHydrator
from reports.services.risk_engine import derive_overall_risk_level, run_risk_engine

logger = logging.getLogger(__name__)

EXPLANATION_PROMPT_TEMPLATE = """
You are a patient-friendly medical explainer.
I have already detected the following structured medication risks using a verified rule engine.
Your ONLY job is to explain these risks in simple, calm, empathetic language that a patient can understand.
DO NOT invent new risks. DO NOT diagnose. DO NOT recommend stopping medicines without advising doctor consultation.

Patient health context summary:
{context_summary}

Detected risks (structured):
{risks_json}

Return JSON only with the following structure:
{{
  "summary": "<1-2 sentence overview of the overall risk picture>",
  "riskLevel": "<safe | low | moderate | high | critical>",
  "explanations": [
    {{
      "severity": "<low | moderate | high | critical>",
      "title": "<short descriptive title>",
      "medicines": ["<medicine name>", ...],
      "patientExplanation": "<plain language explanation of why this is risky>",
      "whatToDo": "<one clear, non-alarming action the patient should take>"
    }}
  ],
  "generalAdvice": "<one paragraph of general reassurance and guidance>"
}}
"""

SAFE_EXPLANATION = {
    "summary": "No significant medication conflicts were detected based on available information.",
    "riskLevel": "safe",
    "explanations": [],
    "generalAdvice": (
        "Always carry your complete medicine list to every doctor visit. "
        "If you develop any new symptom after starting a medicine, contact your prescribing doctor promptly."
    ),
}


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------

def build_patient_context(
    new_medications: list[dict],
    active_prescriptions: list[PrescriptionRecord],
    selected_reports: list[Report],
) -> dict[str, Any]:
    """
    Derive:
    - active_medications: flat list of medicine dicts from ongoing prescriptions
    - lab_flags: dict of boolean health signals from structured report data
    - conditions: list of plain-text condition labels (derived from abnormal markers)
    """
    hydrator = ReportHydrator()

    # Collect medicines from all active prescriptions
    active_medications: list[dict] = []
    for record in active_prescriptions:
        meds = record.report.medications or []
        for med in meds:
            active_medications.append({
                "medicine_name": med.get("name") or med.get("medicine_name"),
                "dosage": med.get("dosage"),
                "source_prescription_id": str(record.id),
            })

    # Derive lab_flags and conditions from selected report structured data
    lab_flags: dict[str, bool] = {}
    conditions: list[str] = []
    hydrated_reports: list[dict] = []

    for report in selected_reports:
        hydrated = hydrator.hydrate(report)
        hydrated_reports.append(hydrated)
        structured = hydrated.get("structuredData", [])
        for item in structured:
            flag = item.get("flag", "normal")
            test_name_lower = (item.get("testName") or "").lower()
            if flag == "normal":
                continue
            # Map specific marker names to boolean lab_flags
            if any(t in test_name_lower for t in ("hemoglobin", "hgb", "hb")) and flag == "low":
                lab_flags["low_hemoglobin"] = True
            if "creatinine" in test_name_lower and flag == "high":
                lab_flags["high_creatinine"] = True
            if "egfr" in test_name_lower and flag == "low":
                lab_flags["kidney_risk"] = True
            if any(t in test_name_lower for t in ("alt", "sgpt", "ast", "sgot", "bilirubin")) and flag == "high":
                lab_flags["liver_risk"] = True
            if any(t in test_name_lower for t in ("glucose", "hba1c", "sugar")) and flag == "high":
                lab_flags["diabetes"] = True
                conditions.append("diabetes")
            if "potassium" in test_name_lower and flag == "high":
                lab_flags["high_potassium"] = True
            if "platelet" in test_name_lower and flag == "low":
                lab_flags["low_platelets"] = True

        # Extract conditions from AI explanation holistic summary if available
        ai_exp = hydrated.get("aiExplanation", {})
        summary_text = (ai_exp.get("holisticSummary") or "").lower()
        for condition_keyword in ("piles", "haemorrhoid", "hemorrhoid", "asthma", "peptic ulcer", "heart failure", "kidney disease", "liver disease", "pregnancy", "myasthenia"):
            if condition_keyword in summary_text:
                conditions.append(condition_keyword)

    return {
        "new_medications": new_medications,
        "active_medications": active_medications,
        "lab_flags": lab_flags,
        "conditions": list(set(conditions)),
        "hydrated_reports": hydrated_reports,
    }


# ---------------------------------------------------------------------------
# Gemini explanation layer
# ---------------------------------------------------------------------------

def _explain_with_gemini(risks: list[dict], context: dict, language: str, gemini_service) -> dict:
    """Ask Gemini to explain the pre-detected structured risks in plain language."""
    if not risks:
        return SAFE_EXPLANATION

    context_summary = {
        "new_medicines_count": len(context.get("new_medications", [])),
        "active_medicines_count": len(context.get("active_medications", [])),
        "lab_flags": context.get("lab_flags", {}),
        "conditions": context.get("conditions", []),
    }

    prompt = EXPLANATION_PROMPT_TEMPLATE.format(
        context_summary=json.dumps(context_summary, default=str),
        risks_json=json.dumps(risks, default=str),
    )

    try:
        raw = gemini_service.generate_json(
            prompt=prompt,
            report_text=json.dumps(risks, default=str),
            report_type="medication_risk_explanation",
            workload="feature",
        )
        import re as _re
        cleaned = _re.sub(r"```(?:json)?|```", "", raw).strip()
        return json.loads(cleaned)
    except Exception as exc:
        logger.warning("Gemini explanation failed for risk analysis (%s); using fallback.", exc.__class__.__name__)
        return _fallback_explanation(risks)


def _fallback_explanation(risks: list[dict]) -> dict:
    """Build a plain explanation without Gemini when it is unavailable."""
    overall = derive_overall_risk_level(risks)
    summary_parts = []
    explanations = []
    for risk in risks:
        medicines_text = ", ".join(risk.get("affected_medicines") or [])
        title = risk.get("risk_type", "Potential interaction").replace("_", " ").title()
        explanations.append({
            "severity": risk["severity"],
            "title": title,
            "medicines": risk.get("affected_medicines", []),
            "patientExplanation": risk.get("reason", "A potential interaction was detected."),
            "whatToDo": risk.get("recommendation", "Please discuss this with your doctor."),
        })
        summary_parts.append(f"{risk['severity'].upper()} — {medicines_text}: {risk.get('reason', '')}")

    return {
        "summary": f"{len(risks)} potential risk(s) detected. " + (summary_parts[0] if summary_parts else ""),
        "riskLevel": overall,
        "explanations": explanations,
        "generalAdvice": (
            "These findings were generated by a local rule engine while the AI explanation service was unavailable. "
            "Please review these with your doctor before making any changes to your medicines."
        ),
    }


# ---------------------------------------------------------------------------
# Public orchestration function
# ---------------------------------------------------------------------------

def run_prescription_analysis(
    *,
    prescription_record: PrescriptionRecord,
    confirmed_medications: list[dict],
    comparison_prescription_ids: list[str],
    selected_report_ids: list[str],
    user,
    gemini_service,
    language: str = "en",
) -> tuple[dict, PrescriptionAnalysis]:
    """
    Full pipeline:
    1. Fetch active prescriptions and selected reports.
    2. Build patient context.
    3. Run risk engine.
    4. Generate Gemini explanation.
    5. Persist result.

    Returns (result_dict, PrescriptionAnalysis instance).
    """
    # 1. Fetch comparison prescriptions
    active_prescriptions = list(
        PrescriptionRecord.objects.filter(
            id__in=comparison_prescription_ids,
            user=user,
            status="ongoing",
        )
        .exclude(id=prescription_record.id)
        .select_related("report")
    )

    # 2. Fetch selected reports
    selected_reports = list(
        Report.objects.filter(
            id__in=selected_report_ids,
            user=user,
        ).exclude(id=prescription_record.report_id)
    )

    # 3. Build patient context
    context = build_patient_context(
        new_medications=confirmed_medications,
        active_prescriptions=active_prescriptions,
        selected_reports=selected_reports,
    )

    # 4. Run deterministic risk engine
    risks = run_risk_engine(
        new_medications=context["new_medications"],
        active_medications=context["active_medications"],
        lab_flags=context["lab_flags"],
        conditions=context["conditions"],
    )

    # 5. Gemini explanation
    explanation = _explain_with_gemini(risks, context, language, gemini_service)

    # Merge structured risks into explanation output
    result = {
        **explanation,
        "structuredRisks": risks,
        "riskCount": len(risks),
        "contextUsed": {
            "newMedicationCount": len(confirmed_medications),
            "activePrescriptionCount": len(active_prescriptions),
            "selectedReportCount": len(selected_reports),
            "labFlags": context["lab_flags"],
            "conditions": context["conditions"],
        },
        "dataUsed": {
            "prescriptionId": str(prescription_record.id),
            "comparisonPrescriptionIds": [str(p.id) for p in active_prescriptions],
            "selectedReportIds": [str(r.id) for r in selected_reports],
        },
    }

    # 6. Persist — save analysis result
    analysis = PrescriptionAnalysis.objects.create(
        prescription=prescription_record,
        user=user,
        related_report_ids=[str(r.id) for r in selected_reports],
        comparison_prescription_ids=[str(p.id) for p in active_prescriptions],
        result=result,
    )

    # Update report links
    PrescriptionReportLink.objects.filter(prescription=prescription_record).exclude(
        report_id__in=[r.id for r in selected_reports]
    ).delete()
    for report in selected_reports:
        PrescriptionReportLink.objects.get_or_create(prescription=prescription_record, report=report)

    return result, analysis
