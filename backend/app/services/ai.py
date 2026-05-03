import json
from datetime import UTC, datetime

import google.generativeai as genai

from app.core.config import get_settings
from app.schemas.report import AIExplanation, SummaryResponse
from app.services.prompts import IMAGE_OCR_PROMPT, SYSTEM_PROMPT
from app.utils.sanitizer import is_off_topic


class GeminiService:
    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
        self.text_model = genai.GenerativeModel(settings.gemini_model_text, system_instruction=SYSTEM_PROMPT)
        self.vision_model = genai.GenerativeModel(settings.gemini_model_vision, system_instruction=SYSTEM_PROMPT)

    async def extract_text_from_image(self, content: bytes, mime_type: str) -> str:
        response = self.vision_model.generate_content(
            [{"mime_type": mime_type, "data": content}, IMAGE_OCR_PROMPT],
            generation_config={"temperature": 0},
        )
        return response.text.strip()

    async def generate_json(self, prompt: str, report_text: str, report_type: str) -> str:
        wrapped = (
            f"{prompt}\nReport type: {report_type}\n=== REPORT DATA START ===\n{report_text}\n=== REPORT DATA END ==="
        )
        response = self.text_model.generate_content(
            wrapped,
            generation_config={"temperature": 0.1, "response_mime_type": "application/json"},
        )
        return response.text.strip()

    async def explain_report(
        self,
        report_type: str,
        language: str,
        age_years: int | None,
        biological_sex: str | None,
        structured_data: list[dict],
    ) -> AIExplanation:
        prompt = f"""
Return JSON with keys parameterLevel, holisticSummary, attentionScore, confidenceNote, disclaimer.
Each parameterLevel item must contain parameter, explanation, confidence.
Use calm wording, never diagnose, and speak in language code {language}.
Context:
- reportType: {report_type}
- ageYears: {age_years}
- biologicalSex: {biological_sex}
- data: {json.dumps(structured_data, default=str)}
"""
        raw = await self.generate_json(prompt=prompt, report_text=json.dumps(structured_data, default=str), report_type=report_type)
        parsed = json.loads(raw)
        return AIExplanation(**parsed)

    async def answer_chat(
        self,
        report_type: str,
        language: str,
        structured_data: list[dict],
        chat_history: list[dict],
        message: str,
    ) -> str:
        if is_off_topic(message):
            return "I can only answer questions about your uploaded reports"
        prompt = f"""
Answer only with content grounded in the structured report data.
If the question cannot be answered from the report, say so plainly.
Always cite the value you are referencing, for example 'Based on your hemoglobin of 9.2 g/dL...'
Respond in language code {language}.
Chat history: {json.dumps(chat_history[-8:], default=str)}
User message: {message}
Structured data: {json.dumps(structured_data, default=str)}
Report type: {report_type}
"""
        response = self.text_model.generate_content(
            prompt,
            generation_config={"temperature": 0.2},
        )
        return response.text.strip()

    async def explain_prescription(self, language: str, extracted_text: str, related_reports: list[dict]) -> dict:
        prompt = f"""
Return JSON with key medications as an array of objects containing name, dosage, frequency, duration,
purpose, sideEffects, avoid, interactionNotes.
Respond in language code {language}. Never suggest stopping medicines.
Related blood data: {json.dumps(related_reports, default=str)}
"""
        raw = await self.generate_json(prompt=prompt, report_text=extracted_text, report_type="prescription")
        return json.loads(raw)

    async def generate_summary(self, report: dict, previous_report: dict | None, language: str) -> SummaryResponse:
        prompt = f"""
Create a printable pre-appointment summary in markdown and return JSON with:
summaryMarkdown, doctorQuestions (3 to 5), shareText.
Respond in language code {language}.
Current report: {json.dumps(report, default=str)}
Previous report: {json.dumps(previous_report, default=str) if previous_report else 'null'}
"""
        raw = await self.generate_json(prompt=prompt, report_text=json.dumps(report, default=str), report_type=report["reportType"])
        return SummaryResponse(**json.loads(raw))

    async def queue_fallback_payload(self, report_id: str, user_id: str, reason: str) -> dict:
        return {
            "_id": report_id,
            "userId": user_id,
            "reason": reason,
            "status": "pending",
            "createdAt": datetime.now(UTC),
        }
