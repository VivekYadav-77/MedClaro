"""
Prescription Extraction Service
---------------------------------
Extracts structured medicine data from an uploaded prescription
file (image or PDF) using Gemini Vision and pdfplumber.

The extraction is intentionally separated from risk analysis so the
user can inspect and correct the extracted medicine list before any
risk logic is applied.
"""

import io
import json
import logging
import re

import pdfplumber

logger = logging.getLogger(__name__)

MEDICINE_EXTRACTION_PROMPT = """
You are a prescription parser.
Extract every medicine listed in the prescription text below and return STRICT JSON only.
Do NOT include any explanation, markdown, or extra text outside the JSON object.

Required JSON structure:
{
  "doctor_name": "<doctor name if visible, else null>",
  "specialty": "<doctor specialty if visible, else null>",
  "diagnosis": "<diagnosis or condition written on the prescription, else null>",
  "doctor_notes": "<instructions or notes not belonging to a single medicine, else null>",
  "prescription_date": "<date if visible, else null>",
  "extraction_confidence": "high|medium|low",
  "medications": [
    {
      "medicine_name": "<brand or generic name as written>",
      "dosage": "<strength e.g. 500mg, 10ml>",
      "frequency": "<e.g. twice daily, 1-0-1, TDS>",
      "duration": "<e.g. 5 days, 1 month, ongoing>",
      "route": "<oral / topical / injection if mentioned, else null>"
    }
  ]
}

Rules:
- Extract only visible prescription facts. Do NOT add medical advice.
- If a field is not mentioned in the prescription, set it to null.
- Normalise the medicine name to its most common spelling.
- Do NOT invent medicines that are not present in the text.

Prescription text:
"""


def extract_medicines_from_text(raw_text: str, gemini_service) -> dict:
    """
    Call Gemini to parse raw prescription text into a structured list
    of medicines. Returns a dict with a 'medications' key.
    """
    if not raw_text or not raw_text.strip():
        return {"medications": [], "extractionNote": "No readable text was found in the prescription."}

    prompt = MEDICINE_EXTRACTION_PROMPT + raw_text

    try:
        # Re-use the existing GeminiService.generate_json infrastructure
        raw_response = gemini_service.generate_json(
            prompt=prompt,
            report_text=raw_text,
            report_type="prescription",
            workload="extraction",
        )
        # Strip potential markdown code fences
        cleaned = re.sub(r"```(?:json)?|```", "", raw_response).strip()
        data = json.loads(cleaned)
        medications = data.get("medications") or []
        return {
            "medications": medications,
            "doctorName": data.get("doctor_name"),
            "specialty": data.get("specialty"),
            "diagnosis": data.get("diagnosis"),
            "doctorNotes": data.get("doctor_notes"),
            "prescriptionDate": data.get("prescription_date"),
            "extractionConfidence": data.get("extraction_confidence") or "medium",
            "rawTextLength": len(raw_text),
            "extractedCount": len(medications),
        }
    except json.JSONDecodeError as exc:
        logger.warning("Prescription extraction JSON parse error: %s", exc)
        return _fallback_extraction(raw_text)
    except Exception as exc:
        logger.warning("Gemini prescription extraction failed (%s); using fallback.", exc.__class__.__name__)
        return _fallback_extraction(raw_text)


def extract_text_from_file(content: bytes, mime_type: str, gemini_service) -> str:
    """
    Extract plain text from the uploaded file.
    - PDF  → pdfplumber
    - Image → Gemini OCR (uses existing extract_text_from_image)
    """
    if mime_type == "application/pdf":
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages = []
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text(layout=True) or ""
                    pages.append(f"--- [PAGE {i + 1}] ---\n{page_text}")
                return "\n\n".join(pages).strip()
        except Exception as exc:
            logger.warning("pdfplumber failed for prescription extraction: %s", exc)
            return ""
    else:
        # Image — delegate to the existing Gemini Vision helper
        try:
            return gemini_service.extract_text_from_image(content, mime_type)
        except Exception as exc:
            logger.warning("Gemini OCR failed for prescription extraction: %s", exc)
            return ""


# ---------------------------------------------------------------------------
# Fallback – simple regex-based extraction for when Gemini is unavailable
# ---------------------------------------------------------------------------
_COMMON_FORMS = re.compile(
    r"\b(tab(?:let)?|cap(?:sule)?|syp|syrup|inj|injection|oint(?:ment)?|drop|gel|cream|spray|patch|inhaler)\b",
    re.IGNORECASE,
)
_DOSE_PATTERN = re.compile(r"\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|iu|units?))\b", re.IGNORECASE)
_FREQ_PATTERN = re.compile(
    r"\b(\d-\d-\d|\d-\d|\bonce\b|\btwice\b|\bthrice\b|OD|BD|TDS|QID|SOS|HS|after meals?|before meals?)\b",
    re.IGNORECASE,
)
_DURATION_PATTERN = re.compile(r"\b(\d+\s*(?:day|days|week|weeks|month|months))\b", re.IGNORECASE)


def _fallback_extraction(raw_text: str) -> dict:
    """
    Best-effort local extraction when Gemini is unavailable.
    Only captures medicines that appear near a recognisable dosage form.
    """
    medications = []
    lines = raw_text.splitlines()
    for line in lines:
        if not _COMMON_FORMS.search(line):
            continue
        # Strip the form prefix to get a candidate name
        name_candidate = _COMMON_FORMS.sub("", line).strip().split("\n")[0]
        # Remove dose/freq tokens to isolate name
        name_candidate = _DOSE_PATTERN.sub("", name_candidate)
        name_candidate = _FREQ_PATTERN.sub("", name_candidate)
        name_candidate = re.sub(r"\s{2,}", " ", name_candidate).strip(" .,;:-")
        if not name_candidate or len(name_candidate) < 3:
            continue
        dose_match = _DOSE_PATTERN.search(line)
        freq_match = _FREQ_PATTERN.search(line)
        dur_match = _DURATION_PATTERN.search(line)
        medications.append({
            "medicine_name": name_candidate[:120],
            "dosage": dose_match.group(1) if dose_match else None,
            "frequency": freq_match.group(1) if freq_match else None,
            "duration": dur_match.group(1) if dur_match else None,
            "route": None,
        })
    return {
        "medications": medications[:20],
        "doctorName": None,
        "specialty": None,
        "diagnosis": None,
        "doctorNotes": None,
        "prescriptionDate": None,
        "extractionConfidence": "low",
        "extractionNote": (
            "Gemini was unavailable. This is a basic local extraction; "
            "please review and correct the medicine list carefully."
        ),
        "extractedCount": len(medications),
    }
