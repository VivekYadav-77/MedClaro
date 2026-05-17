import json
import re

from django.db import transaction

from reports.models import PrescriptionContextualAnalysis, PrescriptionReportLink, Report
from reports.services import GeminiService, ReportHydrator


def _key(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _json_safe(value):
    return json.loads(json.dumps(value, default=str))


THERAPY_DOMAINS = {
    "diabetes": {
        "medicine_terms": ("metformin", "insulin", "glimepiride", "sitagliptin", "dapagliflozin", "empagliflozin", "gliclazide"),
        "marker_terms": ("hba1c", "a1c", "glucose", "sugar", "fasting", "ppbs"),
        "report_types": ("hba1c", "blood_test"),
        "reason": "Matches glucose or HbA1c monitoring.",
    },
    "thyroid": {
        "medicine_terms": ("thyroxine", "levothyroxine", "eltroxin", "thyronorm", "carbimazole", "methimazole"),
        "marker_terms": ("tsh", "t3", "t4", "thyroid"),
        "report_types": ("thyroid_panel",),
        "reason": "Matches thyroid marker monitoring.",
    },
    "lipid": {
        "medicine_terms": ("atorvastatin", "rosuvastatin", "statin", "fenofibrate", "ezetimibe"),
        "marker_terms": ("cholesterol", "ldl", "hdl", "triglyceride", "lipid"),
        "report_types": ("lipid_panel",),
        "reason": "Matches cholesterol or lipid monitoring.",
    },
    "anemia": {
        "medicine_terms": ("iron", "ferrous", "folic", "folate", "b12", "methylcobalamin", "cyanocobalamin"),
        "marker_terms": ("hemoglobin", "ferritin", "iron", "b12", "rbc"),
        "report_types": ("blood_test", "vitamin_panel"),
        "reason": "Matches anemia, iron, or vitamin marker monitoring.",
    },
    "kidney": {
        "medicine_terms": ("telmisartan", "losartan", "furosemide", "torsemide", "spironolactone", "nsaid", "ibuprofen", "diclofenac"),
        "marker_terms": ("creatinine", "egfr", "urea", "urine", "protein", "albumin"),
        "report_types": ("urine_analysis", "blood_test"),
        "reason": "Matches kidney or urine monitoring.",
    },
}


class PrescriptionContextualAnalysisService:
    def __init__(self) -> None:
        self.hydrator = ReportHydrator()
        self.ai = GeminiService()

    def candidate_reports(self, prescription) -> list[dict]:
        prescription_context = self._prescription_payload(prescription)
        reports = (
            Report.objects.filter(user=prescription.user)
            .exclude(id=prescription.report_id)
            .exclude(report_type="prescription")
            .select_related("user", "family_member")
            .prefetch_related("chat_messages")
            .order_by("-report_date", "-upload_date")
        )
        hydrated_reports = [self.hydrator.hydrate(report) for report in reports]
        analyzed_reports = [
            report
            for report in hydrated_reports
            if report.get("structuredData") or report.get("aiExplanation")
        ]
        candidates = [self._candidate_payload(report, prescription_context) for report in analyzed_reports]
        return sorted(candidates, key=lambda item: (item["relevanceScore"], str(item["reportDate"] or item["uploadDate"] or "")), reverse=True)

    @transaction.atomic
    def analyze(self, prescription, report_ids: list[str], mode: str = "with_reports") -> dict:
        selected_reports = list(
            Report.objects.filter(id__in=report_ids, user=prescription.user)
            .exclude(id=prescription.report_id)
            .exclude(report_type="prescription")
            .select_related("user", "family_member")
            .prefetch_related("chat_messages")
        )
        if mode == "with_reports" and len({str(report.id) for report in selected_reports}) != len(set(report_ids)):
            raise ValueError("One or more selected reports are unavailable for contextual analysis.")
        selected_ids = [str(report.id) for report in selected_reports] if mode != "prescription_only" else []
        PrescriptionReportLink.objects.filter(prescription=prescription).exclude(report_id__in=selected_ids).delete()
        for report in selected_reports:
            PrescriptionReportLink.objects.get_or_create(prescription=prescription, report=report)

        context = _json_safe(self._build_context(prescription, selected_reports if mode != "prescription_only" else []))
        confidence = self._confidence_for(context)
        existing = (
            PrescriptionContextualAnalysis.objects.filter(
                user=prescription.user,
                prescription=prescription,
                selected_report_ids=selected_ids,
            )
            .order_by("-updated_at")
            .first()
        )
        if existing and existing.context_snapshot == context:
            return self._serialize_analysis(existing)

        try:
            result = self._ai_analysis(context, prescription.user.preferred_language)
        except Exception:
            result = self._fallback_analysis(context)
        result = _json_safe(result)
        result.setdefault("likelyTreating", "This prescription can be explained from the saved prescription details.")
        result.setdefault("reportConnections", [])
        result.setdefault("medicineExplanations", [])
        result.setdefault("abnormalIndicatorsConnectedToMedicines", [])
        result["confidence"] = confidence
        result["confidenceReason"] = self._confidence_reason(context, confidence)
        result.setdefault(
            "disclaimer",
            "This explanation is educational and should be reviewed with a qualified clinician. Do not start, stop, or change medicines based on this analysis.",
        )

        analysis = PrescriptionContextualAnalysis.objects.create(
            user=prescription.user,
            prescription=prescription,
            selected_report_ids=selected_ids,
            context_snapshot=context,
            result=result,
            confidence=confidence,
        )
        return self._serialize_analysis(analysis)

    def _candidate_payload(self, report: dict, prescription_context: dict) -> dict:
        abnormal = [item for item in report.get("structuredData", []) if item.get("flag") != "normal"]
        score, reasons = self._score_report(report, prescription_context)
        summary = report.get("aiExplanation", {}).get("holisticSummary") or (
            f"{len(abnormal)} out-of-range marker(s)" if abnormal else "No out-of-range markers detected"
        )
        return {
            "reportId": report["_id"],
            "reportType": report.get("reportType"),
            "reportDate": report.get("reportDate"),
            "uploadDate": report.get("uploadDate"),
            "labName": report.get("labName") or report.get("reportType"),
            "analysisSummary": summary,
            "analysisStatus": "analyzed",
            "abnormalCount": len(abnormal),
            "relevanceScore": score,
            "relevanceReasons": reasons or ["Available analyzed report."],
        }

    def _score_report(self, report: dict, prescription_context: dict) -> tuple[int, list[str]]:
        medicines = " ".join(_key(item.get("name") or item.get("medicine_name")) for item in prescription_context.get("medications", []))
        diagnosis = _key(prescription_context.get("diagnosis"))
        notes = _key(prescription_context.get("doctorNotes"))
        source_text = f"{medicines} {diagnosis} {notes}"
        marker_text = " ".join(_key(item.get("testName")) for item in report.get("structuredData", []))
        report_type = report.get("reportType", "")
        score = 0
        reasons = []
        for domain in THERAPY_DOMAINS.values():
            prescription_match = any(term in source_text for term in domain["medicine_terms"] + domain["marker_terms"])
            report_match = report_type in domain["report_types"] or any(term in marker_text for term in domain["marker_terms"])
            if prescription_match and report_match:
                score += 70
                reasons.append(domain["reason"])
            elif report_match:
                score += 15
        abnormal_count = sum(1 for item in report.get("structuredData", []) if item.get("flag") != "normal")
        if abnormal_count:
            score += min(abnormal_count * 5, 20)
        return min(score, 100), reasons

    def _build_context(self, prescription, reports: list[Report]) -> dict:
        prescription_payload = self._prescription_payload(prescription)
        related_reports = []
        candidates = {item["reportId"]: item for item in self.candidate_reports(prescription)}
        for report in reports:
            hydrated = self.hydrator.hydrate(report)
            abnormal = [
                {
                    "name": item.get("testName"),
                    "value": item.get("value"),
                    "unit": item.get("unit", ""),
                    "flag": item.get("flag"),
                }
                for item in hydrated.get("structuredData", [])
                if item.get("flag") != "normal"
            ][:12]
            related_reports.append(
                {
                    "reportId": hydrated["_id"],
                    "type": hydrated.get("reportType"),
                    "date": str(hydrated.get("reportDate") or hydrated.get("uploadDate") or "")[:10],
                    "summary": hydrated.get("aiExplanation", {}).get("holisticSummary", ""),
                    "abnormalMarkers": abnormal,
                    "relevance": candidates.get(hydrated["_id"], {}),
                }
            )
        return {
            "prescription": prescription_payload,
            "relatedReports": related_reports,
            "hasRelatedReports": bool(related_reports),
        }

    def _prescription_payload(self, prescription) -> dict:
        context = prescription.prescription_context or {}
        medications = prescription.medications_snapshot or prescription.report.medications or context.get("medications") or []
        return {
            "id": str(prescription.id),
            "reportId": str(prescription.report_id),
            "date": str(prescription.start_date or prescription.report.report_date or prescription.report.upload_date or "")[:10],
            "status": prescription.status,
            "doctorName": prescription.doctor_name or context.get("doctorName", ""),
            "specialty": prescription.specialty or context.get("specialty", ""),
            "doctorNotes": prescription.notes or context.get("doctorNotes", ""),
            "diagnosis": context.get("diagnosis", ""),
            "prescriptionDate": context.get("prescriptionDate"),
            "medications": medications,
            "extractionConfidence": context.get("extractionConfidence"),
        }

    def _confidence_for(self, context: dict) -> str:
        reports = context.get("relatedReports", [])
        if not reports:
            return "low"
        if any((report.get("relevance") or {}).get("relevanceScore", 0) >= 60 for report in reports):
            return "high"
        return "medium"

    def _confidence_reason(self, context: dict, confidence: str) -> str:
        if confidence == "high":
            return "Selected reports contain markers that appear related to the prescription."
        if confidence == "medium":
            return "Reports were selected, but their relationship to the prescription is not strong."
        return "No related analyzed reports were provided, so the explanation uses prescription details only."

    def _ai_analysis(self, context: dict, language: str) -> dict:
        prompt = f"""
Return STRICT JSON for patient-friendly prescription contextual analysis.
Keys required:
- likelyTreating: short educational explanation of what the prescription may be for
- reportConnections: array of strings connecting selected report findings to medicines
- medicineExplanations: array with medicineName, purpose, patientExplanation
- abnormalIndicatorsConnectedToMedicines: array with marker, value, medicineConnection
- confidence: high, medium, or low
- confidenceReason: short reason
- disclaimer: educational, non-diagnostic safety note
Rules:
- Use only the structured context.
- Do not diagnose.
- Do not tell the user to start, stop, or change medicines.
- Do not say the prescription is correct or incorrect.
- Phrase risk or mismatch signals as clinician discussion points.
- Respond in language code {language}.
Context: {json.dumps(context, default=str)}
"""
        raw = self.ai.generate_json(prompt=prompt, report_text=json.dumps(context, default=str), report_type="prescription_context", workload="feature")
        return json.loads(raw)

    def _fallback_analysis(self, context: dict) -> dict:
        prescription = context.get("prescription", {})
        medicines = prescription.get("medications", [])
        related_reports = context.get("relatedReports", [])
        med_names = [item.get("name") or item.get("medicine_name") for item in medicines if item.get("name") or item.get("medicine_name")]
        abnormal = [
            marker
            for report in related_reports
            for marker in report.get("abnormalMarkers", [])
        ][:8]
        return {
            "likelyTreating": (
                f"This prescription includes {', '.join(med_names[:5])}."
                if med_names
                else "The prescription was saved, but medicine names need review."
            ),
            "reportConnections": [
                f"{item.get('name')}: {item.get('value')} {item.get('unit', '')} is marked {item.get('flag')}; discuss whether this matters for the prescription with your clinician."
                for item in abnormal
            ],
            "medicineExplanations": [
                {
                    "medicineName": item.get("name") or item.get("medicine_name") or "Medicine",
                    "purpose": item.get("purpose") or "Purpose not confirmed from saved context.",
                    "patientExplanation": "Review this medicine with the prescribing clinician, especially if reports were linked.",
                }
                for item in medicines[:10]
            ],
            "abnormalIndicatorsConnectedToMedicines": [
                {
                    "marker": item.get("name"),
                    "value": f"{item.get('value')} {item.get('unit', '')}".strip(),
                    "medicineConnection": "This marker may be useful as a clinician discussion point when reviewing the prescription.",
                }
                for item in abnormal
            ],
            "disclaimer": "Gemini is unavailable, so this is a conservative summary from saved structured data, not a diagnosis. Do not start, stop, or change medicines based on this analysis.",
        }

    def _serialize_analysis(self, analysis) -> dict:
        return {
            "id": str(analysis.id),
            "prescriptionId": str(analysis.prescription_id),
            "selectedReportIds": analysis.selected_report_ids,
            "contextSnapshot": analysis.context_snapshot,
            "result": analysis.result,
            "confidence": analysis.confidence,
            "createdAt": analysis.created_at,
            "updatedAt": analysis.updated_at,
        }
