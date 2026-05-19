import json
import re
from collections import defaultdict
from datetime import UTC, datetime

from users.models import FamilyMember

from reports.models import PrescriptionRecord, Report
from reports.services import GeminiService, ReportHydrator, parse_lab_number


DISCLAIMER = "Do not start, stop, or change medicines based on this analysis. Review important findings with a qualified clinician or pharmacist."


def _key(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _has_any(value: str, terms: tuple[str, ...]) -> bool:
    return any(term in value for term in terms)


def _json_safe(value):
    return json.loads(json.dumps(value, default=str))


MEDICINE_CLASSES = {
    "nsaid": ("ibuprofen", "diclofenac", "naproxen", "aceclofenac", "etoricoxib", "indomethacin", "ketorolac"),
    "ace_arb": ("telmisartan", "losartan", "olmesartan", "valsartan", "ramipril", "enalapril", "lisinopril"),
    "diuretic": ("furosemide", "torsemide", "hydrochlorothiazide", "chlorthalidone", "spironolactone"),
    "statin": ("atorvastatin", "rosuvastatin", "simvastatin", "pravastatin"),
    "diabetes": ("metformin", "insulin", "glimepiride", "gliclazide", "sitagliptin", "dapagliflozin", "empagliflozin"),
    "thyroid": ("levothyroxine", "thyroxine", "eltroxin", "thyronorm", "carbimazole", "methimazole"),
    "anticoagulant": ("warfarin", "apixaban", "rivaroxaban", "dabigatran", "heparin", "clopidogrel"),
    "penicillin": ("penicillin", "amoxicillin", "ampicillin", "amoxiclav", "augmentin"),
    "sulfa": ("sulfa", "sulfamethoxazole", "cotrimoxazole", "trimethoprim sulfamethoxazole"),
}


MARKER_GROUPS = {
    "kidney": ("creatinine", "egfr", "urea", "uric acid", "urine protein", "protein", "albumin"),
    "potassium": ("potassium", "k "),
    "liver": ("alt", "ast", "sgpt", "sgot", "bilirubin", "alkaline phosphatase"),
    "glucose": ("glucose", "sugar", "hba1c", "a1c"),
    "thyroid": ("tsh", "t3", "t4", "thyroid"),
    "lipid": ("cholesterol", "ldl", "hdl", "triglyceride"),
    "anemia": ("hemoglobin", "ferritin", "iron", "b12", "rbc"),
}


class PrescriptionRiskAnalysisService:
    def __init__(self) -> None:
        self.hydrator = ReportHydrator()
        self.ai = GeminiService()

    def analyze(
        self,
        user,
        family_member_id: str | None = None,
        prescription_ids: list[str] | None = None,
        report_ids: list[str] | None = None,
    ) -> dict:
        family_member = self._family_member(user, family_member_id)
        prescriptions = self._prescriptions(user, family_member, prescription_ids)
        reports = self._reports(user, family_member, report_ids)
        allergies = self._allergies(user, family_member)
        medicines = self._medicine_payloads(prescriptions)
        markers = self._marker_payloads(reports)
        findings = []
        findings.extend(self._allergy_findings(medicines, allergies))
        findings.extend(self._duplicate_findings(medicines))
        findings.extend(self._class_clash_findings(medicines))
        findings.extend(self._report_context_findings(medicines, markers))
        findings = self._dedupe_findings(findings)
        summary = self._summary(findings, medicines, markers, allergies)
        explanation = self._fallback_explanation(summary)
        return {
            "profile": {
                "familyMemberId": str(family_member.id) if family_member else None,
                "name": family_member.name if family_member else user.name,
            },
            "generatedAt": datetime.now(UTC).isoformat(),
            "prescriptionCount": len(prescriptions),
            "medicineCount": len(medicines),
            "reportCount": len(reports),
            "allergies": allergies,
            "findings": findings,
            "severity": self._overall_severity(findings),
            "confidence": self._confidence(findings, markers),
            "summary": explanation.get("summary", ""),
            "nextSteps": explanation.get("nextSteps", self._default_next_steps(findings)),
            "disclaimer": DISCLAIMER,
            "inputs": {
                "prescriptionIds": [str(record.id) for record in prescriptions],
                "reportIds": [str(report.id) for report in reports],
            },
        }

    def _family_member(self, user, family_member_id: str | None):
        if not family_member_id:
            return None
        member = FamilyMember.objects.filter(id=family_member_id, user=user).first()
        if not member:
            raise ValueError("Family member not found.")
        return member

    def _prescriptions(self, user, family_member, prescription_ids: list[str] | None):
        queryset = (
            PrescriptionRecord.objects.filter(user=user, status__in=["ongoing", "short_course", "unknown"])
            .select_related("report", "report__family_member", "report__user")
            .prefetch_related("report__chat_messages")
            .order_by("-updated_at")
        )
        if family_member:
            queryset = queryset.filter(report__family_member=family_member)
        else:
            queryset = queryset.filter(report__family_member__isnull=True)
        if prescription_ids is not None:
            queryset = queryset.filter(id__in=prescription_ids)
        prescriptions = list(queryset[:30])
        if prescription_ids is not None and len({str(item.id) for item in prescriptions}) != len(set(prescription_ids)):
            raise ValueError("One or more prescription IDs are unavailable for this profile.")
        return prescriptions

    def _reports(self, user, family_member, report_ids: list[str] | None):
        queryset = (
            Report.objects.filter(user=user)
            .exclude(report_type="prescription")
            .select_related("user", "family_member")
            .prefetch_related("chat_messages")
            .order_by("-report_date", "-upload_date")
        )
        if family_member:
            queryset = queryset.filter(family_member=family_member)
        else:
            queryset = queryset.filter(family_member__isnull=True)
        if report_ids is not None:
            queryset = queryset.filter(id__in=report_ids)
        reports = list(queryset[:20])
        if report_ids is not None and len({str(item.id) for item in reports}) != len(set(report_ids)):
            raise ValueError("One or more report IDs are unavailable for this profile.")
        return reports

    def _allergies(self, user, family_member) -> list[dict]:
        raw = family_member.allergies if family_member else user.allergies
        allergies = []
        for item in raw or []:
            if isinstance(item, dict):
                name = str(item.get("name") or item.get("allergen") or "").strip()
                reaction = str(item.get("reaction") or "").strip()
            else:
                name = str(item or "").strip()
                reaction = ""
            if name:
                allergies.append({"name": name[:120], "reaction": reaction[:160]})
        return allergies[:30]

    def _medicine_payloads(self, prescriptions: list[PrescriptionRecord]) -> list[dict]:
        medicines = []
        for record in prescriptions:
            for medication in (record.medications_snapshot or record.report.medications or [])[:20]:
                name = str(medication.get("name") or medication.get("medicine_name") or "").strip()
                if not name:
                    continue
                med_key = _key(name)
                classes = [class_name for class_name, terms in MEDICINE_CLASSES.items() if _has_any(med_key, terms)]
                medicines.append(
                    {
                        "name": name,
                        "key": med_key,
                        "classes": classes,
                        "dosage": medication.get("dosage", ""),
                        "frequency": medication.get("frequency", ""),
                        "prescriptionId": str(record.id),
                        "reportId": str(record.report_id),
                        "sourceDate": str(record.start_date or record.report.report_date or record.report.upload_date or "")[:10],
                    }
                )
        return medicines

    def _marker_payloads(self, reports: list[Report]) -> list[dict]:
        markers = []
        for report in reports:
            hydrated = self.hydrator.hydrate(report)
            for item in hydrated.get("structuredData", [])[:40]:
                name = str(item.get("testName") or "").strip()
                marker_key = _key(name)
                groups = [group for group, terms in MARKER_GROUPS.items() if _has_any(marker_key, terms)]
                if not groups:
                    continue
                value = item.get("normalizedValue") if item.get("normalizedValue") is not None else item.get("value")
                markers.append(
                    {
                        "name": name,
                        "key": marker_key,
                        "groups": groups,
                        "value": value,
                        "unit": item.get("normalizedUnit") or item.get("unit") or "",
                        "flag": item.get("flag") or "normal",
                        "numericValue": parse_lab_number(value),
                        "reportId": hydrated["_id"],
                        "reportDate": str(hydrated.get("reportDate") or hydrated.get("uploadDate") or "")[:10],
                    }
                )
        return markers

    def _allergy_findings(self, medicines: list[dict], allergies: list[dict]) -> list[dict]:
        findings = []
        for allergy in allergies:
            allergy_key = _key(allergy.get("name"))
            if not allergy_key:
                continue
            allergy_classes = [class_name for class_name, terms in MEDICINE_CLASSES.items() if allergy_key == class_name or _has_any(allergy_key, terms)]
            for med in medicines:
                direct_match = allergy_key in med["key"] or med["key"] in allergy_key
                class_match = bool(set(allergy_classes).intersection(med["classes"]))
                if direct_match or class_match:
                    findings.append(
                        self._finding(
                            "allergy_match",
                            "high",
                            "allergy",
                            f"{med['name']} may conflict with the saved allergy: {allergy['name']}.",
                            [med],
                            "Contact your clinician or pharmacist promptly to confirm whether this medicine is safe for this allergy profile.",
                            allergies=[allergy],
                        )
                    )
        return findings

    def _duplicate_findings(self, medicines: list[dict]) -> list[dict]:
        grouped = defaultdict(list)
        for med in medicines:
            grouped[med["key"]].append(med)
        return [
            self._finding(
                "duplicate_medicine",
                "watch",
                "local_rule",
                f"{items[0]['name']} appears more than once across active prescriptions.",
                items,
                "Ask your clinician or pharmacist whether this is intentional duplicate therapy.",
            )
            for items in grouped.values()
            if len({item["prescriptionId"] for item in items}) > 1
        ]

    def _class_clash_findings(self, medicines: list[dict]) -> list[dict]:
        findings = []
        for class_name in ("nsaid", "anticoagulant", "diabetes", "thyroid", "statin", "ace_arb", "diuretic"):
            items = [med for med in medicines if class_name in med["classes"]]
            unique_names = {item["key"] for item in items}
            if len(unique_names) > 1:
                severity = "high" if class_name == "anticoagulant" else "watch"
                findings.append(
                    self._finding(
                        f"duplicate_{class_name}_class",
                        severity,
                        "local_rule",
                        f"Multiple active medicines were detected in the {class_name.replace('_', '/')} group.",
                        items,
                        "Review whether these medicines are meant to be taken together, especially if they came from different prescriptions.",
                    )
                )
        return findings

    def _report_context_findings(self, medicines: list[dict], markers: list[dict]) -> list[dict]:
        findings = []
        if self._meds_in_class(medicines, "nsaid") and self._flagged_markers(markers, "kidney"):
            findings.append(self._report_finding("nsaid_kidney", "watch", "NSAID-type medicines and kidney-related report flags are both present.", medicines, markers, "nsaid", "kidney"))
        if (self._meds_in_class(medicines, "ace_arb") or self._meds_in_class(medicines, "diuretic")) and (
            self._flagged_markers(markers, "kidney") or self._flagged_markers(markers, "potassium")
        ):
            findings.append(
                self._finding(
                    "ace_arb_diuretic_kidney_potassium",
                    "watch",
                    "report_context",
                    "Blood pressure or diuretic medicines appear alongside kidney or potassium report flags.",
                    [*self._meds_in_class(medicines, "ace_arb"), *self._meds_in_class(medicines, "diuretic")],
                    "Discuss whether monitoring, dose review, or follow-up testing is needed. Do not adjust medicines without your clinician.",
                    markers=[*self._flagged_markers(markers, "kidney"), *self._flagged_markers(markers, "potassium")][:6],
                )
            )
        if self._meds_in_class(medicines, "statin") and self._flagged_markers(markers, "liver"):
            findings.append(self._report_finding("statin_liver", "watch", "Statin-type medicines and liver-related report flags are both present.", medicines, markers, "statin", "liver"))
        if self._meds_in_class(medicines, "diabetes") and self._flagged_markers(markers, "glucose"):
            findings.append(self._report_finding("diabetes_glucose", "info", "Diabetes medicines and glucose or HbA1c markers are available for review.", medicines, markers, "diabetes", "glucose"))
        if self._meds_in_class(medicines, "thyroid") and self._flagged_markers(markers, "thyroid"):
            findings.append(self._report_finding("thyroid_marker", "info", "Thyroid medicines and thyroid marker flags are both present.", medicines, markers, "thyroid", "thyroid"))
        if self._meds_in_class(medicines, "anticoagulant") and any(marker.get("flag") != "normal" for marker in markers):
            findings.append(
                self._finding(
                    "anticoagulant_report_context",
                    "watch",
                    "report_context",
                    "An anticoagulant or antiplatelet medicine is active while recent reports have out-of-range markers.",
                    self._meds_in_class(medicines, "anticoagulant"),
                    "Use this as a pharmacist or clinician review point, especially before procedures or new medicines.",
                    markers=[marker for marker in markers if marker.get("flag") != "normal"][:6],
                )
            )
        return findings

    def _report_finding(self, rule_id: str, severity: str, title: str, medicines: list[dict], markers: list[dict], med_class: str, marker_group: str) -> dict:
        return self._finding(
            rule_id,
            severity,
            "report_context",
            title,
            self._meds_in_class(medicines, med_class),
            "Discuss whether monitoring, dose review, or follow-up testing is needed. Do not adjust medicines without your clinician.",
            markers=self._flagged_markers(markers, marker_group)[:6],
        )

    def _meds_in_class(self, medicines: list[dict], class_name: str) -> list[dict]:
        return [med for med in medicines if class_name in med["classes"]]

    def _flagged_markers(self, markers: list[dict], group: str) -> list[dict]:
        return [marker for marker in markers if group in marker["groups"] and marker.get("flag") != "normal"]

    def _finding(self, rule_id: str, severity: str, source: str, title: str, medicines: list[dict], next_step: str, markers=None, allergies=None) -> dict:
        return {
            "id": rule_id,
            "severity": severity,
            "source": source,
            "title": title,
            "description": title,
            "relatedMedicines": [
                {
                    "name": med["name"],
                    "dosage": med.get("dosage", ""),
                    "frequency": med.get("frequency", ""),
                    "prescriptionId": med.get("prescriptionId"),
                    "reportId": med.get("reportId"),
                    "sourceDate": med.get("sourceDate"),
                }
                for med in medicines[:8]
            ],
            "relatedMarkers": [
                {
                    "name": marker.get("name"),
                    "value": marker.get("value"),
                    "unit": marker.get("unit", ""),
                    "flag": marker.get("flag"),
                    "reportId": marker.get("reportId"),
                    "reportDate": marker.get("reportDate"),
                }
                for marker in (markers or [])[:8]
            ],
            "relatedAllergies": allergies or [],
            "nextStep": next_step,
        }

    def _dedupe_findings(self, findings: list[dict]) -> list[dict]:
        seen = set()
        unique = []
        severity_order = {"high": 0, "watch": 1, "info": 2}
        for finding in sorted(findings, key=lambda item: severity_order.get(item.get("severity"), 9)):
            key = (
                finding["id"],
                tuple(sorted(item["name"].lower() for item in finding.get("relatedMedicines", []))),
                tuple(sorted(item["name"].lower() for item in finding.get("relatedMarkers", []))),
            )
            if key in seen:
                continue
            seen.add(key)
            unique.append(finding)
        return unique[:20]

    def _overall_severity(self, findings: list[dict]) -> str:
        if any(item["severity"] == "high" for item in findings):
            return "high"
        if any(item["severity"] == "watch" for item in findings):
            return "watch"
        return "info" if findings else "none"

    def _confidence(self, findings: list[dict], markers: list[dict]) -> str:
        if not findings:
            return "low"
        if markers and any(item["source"] in {"allergy", "report_context"} for item in findings):
            return "high"
        return "medium"

    def _summary(self, findings: list[dict], medicines: list[dict], markers: list[dict], allergies: list[dict]) -> dict:
        return _json_safe(
            {
                "findingCount": len(findings),
                "highestSeverity": self._overall_severity(findings),
                "medicineNames": [item["name"] for item in medicines[:20]],
                "allergies": allergies,
                "flaggedMarkers": [item for item in markers if item.get("flag") != "normal"][:12],
                "findings": findings,
            }
        )

    def _ai_explanation(self, summary: dict, language: str) -> dict:
        prompt = f"""
Return STRICT JSON for a patient-facing prescription risk check.
Required keys:
- summary: one short paragraph
- nextSteps: array of 2 to 4 calm action items
Rules:
- Use only the provided structured findings.
- Do not diagnose.
- Do not tell the user to start, stop, or change medicines.
- For high severity, say to contact a clinician or pharmacist promptly.
- Include this exact safety idea: {DISCLAIMER}
- Respond in language code {language}.
Risk data: {json.dumps(summary, default=str)}
"""
        raw = self.ai.generate_json(prompt=prompt, report_text=json.dumps(summary, default=str), report_type="prescription_risk", workload="feature")
        data = json.loads(raw)
        return {
            "summary": str(data.get("summary") or ""),
            "nextSteps": [str(item) for item in data.get("nextSteps", []) if str(item).strip()][:4],
        }

    def _fallback_explanation(self, summary: dict) -> dict:
        count = summary.get("findingCount", 0)
        severity = summary.get("highestSeverity", "none")
        if count:
            text = f"{count} medication review point(s) were found. Highest level: {severity}. Use these as clinician or pharmacist discussion points."
        else:
            text = "No obvious prescription clash, allergy, or report-based medication risk signal was found from the saved data."
        return {"summary": text, "nextSteps": self._default_next_steps(summary.get("findings", []))}

    def _default_next_steps(self, findings: list[dict]) -> list[str]:
        if any(item.get("severity") == "high" for item in findings):
            return [
                "Contact your clinician or pharmacist promptly to review the high-priority finding.",
                "Keep the prescription, allergy list, and recent reports ready for the review.",
                DISCLAIMER,
            ]
        if findings:
            return [
                "Review these findings with your clinician or pharmacist at the next suitable opportunity.",
                "Bring recent report values and all active prescription names to the discussion.",
                DISCLAIMER,
            ]
        return [
            "Keep prescriptions, allergies, and reports up to date for stronger future checks.",
            DISCLAIMER,
        ]
