"""
Medication Risk Engine
-----------------------
A deterministic, rule-based engine that checks a set of NEW confirmed
medicines against the patient's:
  - active ongoing medications
  - structured lab-report flags
  - known conditions / organ-risk signals

This layer NEVER calls Gemini.  It only produces structured risk objects
that Gemini can then explain in human-friendly language.

Risk severity levels:  low | moderate | high | critical
"""

from __future__ import annotations

import re
from typing import Any

# ---------------------------------------------------------------------------
# Interaction rule database
# Each tuple: (trigger_keywords, conflicting_keywords, severity, reason_code, reason_text)
# ---------------------------------------------------------------------------
INTERACTION_RULES: list[tuple[tuple[str, ...], tuple[str, ...], str, str, str]] = [
    # NSAIDs + anticoagulants / blood-thinners
    (
        ("ibuprofen", "diclofenac", "naproxen", "aspirin", "aceclofenac", "ketorolac", "mefenamic"),
        ("warfarin", "heparin", "rivaroxaban", "apixaban", "dabigatran", "clopidogrel", "enoxaparin"),
        "high",
        "NSAID_ANTICOAG",
        "NSAIDs taken together with blood-thinners significantly increase the risk of serious bleeding.",
    ),
    # NSAIDs + corticosteroids
    (
        ("ibuprofen", "diclofenac", "naproxen", "aspirin", "aceclofenac"),
        ("prednisolone", "dexamethasone", "hydrocortisone", "methylprednisolone", "betamethasone"),
        "moderate",
        "NSAID_STEROID",
        "NSAIDs combined with steroids raise the risk of stomach ulcers and GI bleeding.",
    ),
    # Metformin + contrast / iodine dye risk (reported as caution)
    (
        ("metformin",),
        ("iohexol", "iopamidol", "iodine", "contrast"),
        "moderate",
        "METFORMIN_CONTRAST",
        "Metformin should usually be paused before iodine contrast procedures; consult your doctor.",
    ),
    # Statins + macrolide antibiotics (CYP3A4 interaction)
    (
        ("atorvastatin", "simvastatin", "lovastatin"),
        ("clarithromycin", "erythromycin", "azithromycin"),
        "moderate",
        "STATIN_MACROLIDE",
        "Certain statins and macrolide antibiotics interact, potentially increasing muscle-damage risk.",
    ),
    # MAOIs + various agents
    (
        ("phenelzine", "tranylcypromine", "selegiline", "rasagiline"),
        ("tramadol", "pethidine", "linezolid", "dextromethorphan", "fentanyl"),
        "critical",
        "MAOI_SEROTONIN",
        "This combination can cause a life-threatening serotonin syndrome. Avoid.",
    ),
    # QT-prolonging drugs
    (
        ("haloperidol", "quetiapine", "amiodarone", "azithromycin", "ciprofloxacin", "chloroquine"),
        ("haloperidol", "quetiapine", "amiodarone", "azithromycin", "ciprofloxacin", "chloroquine"),
        "high",
        "QT_PROLONGATION",
        "Multiple QT-prolonging medicines increase the risk of dangerous heart-rhythm abnormalities.",
    ),
    # ACE-inhibitors + potassium-sparing diuretics
    (
        ("enalapril", "lisinopril", "ramipril", "captopril", "perindopril"),
        ("spironolactone", "eplerenone", "amiloride", "triamterene"),
        "moderate",
        "ACE_K_SPARING",
        "ACE-inhibitors combined with potassium-sparing diuretics can cause dangerously high potassium levels.",
    ),
    # Fluoroquinolones + antacids / iron / calcium (absorption)
    (
        ("ciprofloxacin", "levofloxacin", "ofloxacin", "norfloxacin"),
        ("antacid", "calcium", "magnesium", "aluminium", "iron", "ferrous"),
        "low",
        "FQ_ANTACID",
        "Antacids, iron, or calcium salts taken at the same time as fluoroquinolones reduce their absorption. Take 2 hours apart.",
    ),
    # Warfarin + many agents (general flag)
    (
        ("warfarin",),
        ("aspirin", "ibuprofen", "naproxen", "paracetamol", "acetaminophen", "fluconazole", "omeprazole", "rifampicin", "phenytoin", "carbamazepine"),
        "high",
        "WARFARIN_INTERACTION",
        "Warfarin interacts with many medicines and can cause dangerous bleeding or clot changes. Verify dosing with your doctor.",
    ),
]

# Lab-flag → contraindicated medicine categories
LAB_CONTRAINDICATION_RULES: list[tuple[str, str, tuple[str, ...], str, str, str]] = [
    # key in structured_data_encrypted flags, flag value, trigger medicines, severity, reason_code, reason_text
    ("low_hemoglobin", True, ("aspirin", "warfarin", "ibuprofen", "diclofenac", "naproxen"), "high", "ANEMIA_BLEED_RISK", "Low haemoglobin combined with blood-thinners or NSAIDs significantly worsens bleeding risk."),
    ("high_creatinine", True, ("metformin", "ibuprofen", "diclofenac", "naproxen", "gentamicin", "tobramycin"), "high", "KIDNEY_RISK", "Impaired kidney function (raised creatinine) makes certain medicines nephrotoxic or contra-indicated."),
    ("kidney_risk", True, ("metformin", "ibuprofen", "diclofenac", "naproxen"), "high", "KIDNEY_RISK", "Kidney-risk flag detected; NSAID and metformin use requires careful monitoring or avoidance."),
    ("liver_risk", True, ("paracetamol", "acetaminophen", "statins", "atorvastatin", "methotrexate", "isoniazid"), "high", "LIVER_RISK", "Liver-risk flag detected; hepatotoxic medicines need careful dose review."),
    ("diabetes", True, ("prednisolone", "dexamethasone", "betamethasone", "hydrocortisone"), "moderate", "STEROID_GLUCOSE", "Steroids raise blood sugar; additional monitoring is needed in diabetic patients."),
    ("high_potassium", True, ("enalapril", "lisinopril", "ramipril", "spironolactone", "eplerenone", "amiloride"), "high", "HYPERKALEMIA_RISK", "Elevated potassium combined with ACE-inhibitors or potassium-sparing diuretics risks life-threatening hyperkalaemia."),
    ("low_platelets", True, ("aspirin", "clopidogrel", "warfarin", "heparin", "ibuprofen", "naproxen"), "high", "PLATELET_BLEED", "Low platelet count combined with anticoagulants or NSAIDs raises serious bleeding risk."),
]

# Disease-keyword → contraindicated medicine categories (from condition labels)
CONDITION_CONTRAINDICATION_RULES: list[tuple[str, tuple[str, ...], str, str, str]] = [
    ("piles", ("aspirin", "ibuprofen", "diclofenac", "naproxen", "warfarin", "clopidogrel"), "high", "PILES_BLEED", "NSAIDs and blood-thinners can worsen bleeding in patients with piles/haemorrhoids."),
    ("peptic ulcer", ("aspirin", "ibuprofen", "diclofenac", "naproxen", "prednisolone", "dexamethasone"), "high", "PU_GI_BLEED", "NSAIDs and steroids are contraindicated in active peptic ulcer disease."),
    ("asthma", ("aspirin", "ibuprofen", "naproxen", "propranolol", "atenolol", "metoprolol"), "high", "ASTHMA_TRIGGER", "NSAIDs and non-selective beta-blockers can trigger or worsen asthma attacks."),
    ("heart failure", ("ibuprofen", "diclofenac", "naproxen", "verapamil", "diltiazem"), "high", "HF_NSAID", "NSAIDs cause sodium and water retention which can precipitate or worsen heart failure."),
    ("myasthenia gravis", ("gentamicin", "tobramycin", "amikacin", "ciprofloxacin", "chloroquine"), "critical", "MG_NEUROMUSCULAR", "Several antibiotics and antimalarials can worsen myasthenia gravis symptoms."),
    ("pregnancy", ("warfarin", "methotrexate", "isotretinoin", "thalidomide", "finasteride", "misoprostol"), "critical", "TERATOGEN", "This medicine is known to be teratogenic and is contraindicated in pregnancy."),
]


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------
def _norm(name: str | None) -> str:
    """Lowercase, strip punctuation, collapse spaces."""
    if not name:
        return ""
    return re.sub(r"[^a-z0-9 ]+", " ", name.lower()).strip()


def _medicine_matches(medicine_name: str, keywords: tuple[str, ...]) -> bool:
    norm_name = _norm(medicine_name)
    return any(_norm(kw) in norm_name for kw in keywords)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_risk_engine(
    new_medications: list[dict],
    active_medications: list[dict],
    lab_flags: dict[str, Any],
    conditions: list[str],
) -> list[dict]:
    """
    Run all rule checks and return a list of structured risk objects.

    Args:
        new_medications:  List of confirmed medicines from the new prescription.
                          Each dict has at minimum a 'medicine_name' key.
        active_medications: List of currently active medicine dicts from other prescriptions.
        lab_flags: Dict of boolean flags derived from analyzed reports,
                   e.g. {"low_hemoglobin": True, "high_creatinine": False}.
        conditions: List of plain-text condition/disease labels, e.g. ["piles", "asthma"].

    Returns:
        List of risk dicts ordered by severity (critical > high > moderate > low).
    """
    all_medicine_names = [m.get("medicine_name") for m in (new_medications + active_medications)]
    risks: list[dict] = []
    seen_codes: set[str] = set()

    # 1. Drug-drug interaction checks
    for new_med in new_medications:
        new_name = new_med.get("medicine_name", "")
        for (triggers, conflicts, severity, reason_code, reason_text) in INTERACTION_RULES:
            if not _medicine_matches(new_name, triggers):
                continue
            conflicting_found = [
                name for name in all_medicine_names
                if name and _medicine_matches(name, conflicts) and _norm(name) != _norm(new_name)
            ]
            if conflicting_found:
                uid = f"{reason_code}-{_norm(new_name)}"
                if uid not in seen_codes:
                    seen_codes.add(uid)
                    risks.append({
                        "severity": severity,
                        "risk_type": "drug_interaction",
                        "reason_code": reason_code,
                        "affected_medicines": list({new_name} | set(conflicting_found)),
                        "reason": reason_text,
                        "recommendation": "Please discuss this combination with your doctor or pharmacist before continuing.",
                    })

    # 2. Duplicate medicine checks (same normalised name appearing in both lists)
    new_norm_names = {_norm(m.get("medicine_name", "")) for m in new_medications if m.get("medicine_name")}
    active_norm_names = {_norm(m.get("medicine_name", "")) for m in active_medications if m.get("medicine_name")}
    duplicates = new_norm_names & active_norm_names
    for dup in duplicates:
        code = f"DUPLICATE-{dup}"
        if code not in seen_codes:
            seen_codes.add(code)
            risks.append({
                "severity": "moderate",
                "risk_type": "duplicate_medication",
                "reason_code": "DUPLICATE",
                "affected_medicines": [dup],
                "reason": f"'{dup}' appears in both the new prescription and an ongoing prescription. This may result in double-dosing.",
                "recommendation": "Confirm with your doctor whether the older prescription should be stopped before starting this one.",
            })

    # 3. Lab-flag contraindication checks
    for (flag_key, flag_value_expected, trigger_medicines, severity, reason_code, reason_text) in LAB_CONTRAINDICATION_RULES:
        flag_value = lab_flags.get(flag_key)
        if flag_value is None or bool(flag_value) != flag_value_expected:
            continue
        triggered = [
            m.get("medicine_name")
            for m in new_medications
            if _medicine_matches(m.get("medicine_name", ""), trigger_medicines)
        ]
        if triggered:
            code = f"{reason_code}"
            if code not in seen_codes:
                seen_codes.add(code)
                risks.append({
                    "severity": severity,
                    "risk_type": "lab_contraindication",
                    "reason_code": reason_code,
                    "affected_medicines": triggered,
                    "reason": reason_text,
                    "recommendation": "Inform your doctor about this lab finding before starting the medicine.",
                })

    # 4. Condition contraindication checks
    norm_conditions = [_norm(c) for c in conditions]
    for (condition_keyword, trigger_medicines, severity, reason_code, reason_text) in CONDITION_CONTRAINDICATION_RULES:
        if not any(condition_keyword in nc for nc in norm_conditions):
            continue
        triggered = [
            m.get("medicine_name")
            for m in new_medications
            if _medicine_matches(m.get("medicine_name", ""), trigger_medicines)
        ]
        if triggered:
            code = f"{reason_code}"
            if code not in seen_codes:
                seen_codes.add(code)
                risks.append({
                    "severity": severity,
                    "risk_type": "condition_contraindication",
                    "reason_code": reason_code,
                    "affected_medicines": triggered,
                    "reason": reason_text,
                    "recommendation": "Discuss this contraindication urgently with your prescribing doctor.",
                })

    # Sort: critical → high → moderate → low
    _order = {"critical": 0, "high": 1, "moderate": 2, "low": 3}
    risks.sort(key=lambda r: _order.get(r["severity"], 9))
    return risks


def derive_overall_risk_level(risks: list[dict]) -> str:
    """Return the highest severity found in the risk list, or 'safe'."""
    levels = {r["severity"] for r in risks}
    for level in ("critical", "high", "moderate", "low"):
        if level in levels:
            return level
    return "safe"
