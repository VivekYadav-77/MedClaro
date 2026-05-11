import io
import json
import re
from datetime import UTC, datetime
from uuid import uuid4

import magic
import pdfplumber
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings
from app.models.common import ReportType
from app.schemas.report import StructuredParameter
from app.services.ai import GeminiService
from app.services.prompts import STRUCTURED_EXTRACTION_PROMPT
from app.utils.normalizer import normalize_value
from app.utils.pii import strip_pii
from app.utils.sanitizer import sanitize_report_text


REPORT_KEYWORDS = {
    ReportType.blood_test: ("cbc", "hemoglobin", "rbc", "wbc"),
    ReportType.lipid_panel: ("cholesterol", "hdl", "ldl", "triglyceride"),
    ReportType.thyroid_panel: ("tsh", "t3", "t4"),
    ReportType.urine_analysis: ("urine", "protein", "specific gravity"),
    ReportType.hba1c: ("hba1c", "glycated hemoglobin"),
    ReportType.vitamin_panel: ("vitamin", "b12", "vitamin d", "ferritin"),
    ReportType.prescription: ("tablet", "capsule", "take once", "rx"),
    ReportType.xray_report: ("x-ray", "radiograph", "impression"),
}


def normalize_text_field(value, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


class ParserService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.gemini = GeminiService()

    async def validate_upload(self, file: UploadFile) -> bytes:
        content = await file.read()
        if len(content) > self.settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "File exceeds 10MB limit", "code": "FILE_TOO_LARGE"},
            )
        mime_type = magic.from_buffer(content, mime=True)
        if mime_type not in self.settings.allowed_file_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Only PDF, JPEG, and PNG files are supported", "code": "INVALID_FILE_TYPE"},
            )
        return content

    async def extract_text(self, content: bytes, mime_type: str) -> str:
        if mime_type == "application/pdf":
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages).strip()
        return await self.gemini.extract_text_from_image(content, mime_type)

    def detect_report_type(self, text: str) -> ReportType:
        lowered = text.lower()
        for report_type, keywords in REPORT_KEYWORDS.items():
            if any(keyword in lowered for keyword in keywords):
                return report_type
        return ReportType.unknown

    async def build_structured_data(self, text: str, report_type: ReportType) -> list[StructuredParameter]:
        raw = await self.gemini.generate_json(prompt=STRUCTURED_EXTRACTION_PROMPT, report_text=text, report_type=report_type.value)
        items = json.loads(raw) if raw else []
        structured: list[StructuredParameter] = []
        for item in items:
            value = item.get("value")
            test_name = normalize_text_field(item.get("testName"), "Unknown") or "Unknown"
            unit = normalize_text_field(item.get("unit"))
            normalized_value = None
            normalized_unit = None
            if isinstance(value, (int, float)):
                normalized_value, normalized_unit = normalize_value(test_name, float(value), unit)
            structured.append(
                StructuredParameter(
                    testName=test_name,
                    value=value if value is not None else "",
                    unit=unit,
                    normalizedValue=normalized_value,
                    normalizedUnit=normalized_unit,
                    referenceRangeLow=item.get("referenceRangeLow"),
                    referenceRangeHigh=item.get("referenceRangeHigh"),
                    flag=item.get("flag", "normal"),
                )
            )
        return structured

    async def parse_upload(self, file: UploadFile) -> dict:
        content = await self.validate_upload(file)
        mime_type = magic.from_buffer(content, mime=True)
        extracted_text = await self.extract_text(content, mime_type)
        sanitized_text = sanitize_report_text(strip_pii(extracted_text))
        report_type = self.detect_report_type(sanitized_text)
        structured_data = await self.build_structured_data(sanitized_text, report_type)
        report_date = self._detect_date(sanitized_text)
        lab_name = self._detect_lab_name(sanitized_text)
        return {
            "file_bytes": content,
            "mime_type": mime_type,
            "sanitized_text": sanitized_text,
            "report_type": report_type,
            "structured_data": structured_data,
            "report_date": report_date,
            "lab_name": lab_name,
            "file_key": f"reports/{uuid4()}/{file.filename}",
        }

    def _detect_date(self, text: str) -> datetime | None:
        match = re.search(r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b", text)
        if not match:
            return None
        raw = match.group(1).replace("-", "/")
        return datetime.strptime(raw, "%d/%m/%Y").replace(tzinfo=UTC)

    def _detect_lab_name(self, text: str) -> str | None:
        for line in text.splitlines()[:8]:
            cleaned = line.strip()
            if 4 < len(cleaned) < 60:
                return cleaned
        return None
