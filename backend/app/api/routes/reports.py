from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.deps import CurrentUser
from app.core.config import get_settings
from app.core.database import get_database
from app.schemas.report import ReportChatRequest, ReportRecord, SummaryResponse, TrendsResponse
from app.services.ai import GeminiService
from app.services.encryption import EncryptionService
from app.services.parser import ParserService
from app.services.rate_limit import RateLimiter
from app.services.storage import StorageService
from app.services.trends import TrendService


router = APIRouter(prefix="/reports", tags=["reports"])
settings = get_settings()
parser = ParserService()
ai = GeminiService()
storage = StorageService()
rate_limiter = RateLimiter()
encryptor = EncryptionService()
trend_service = TrendService()


@router.post("/upload", response_model=ReportRecord)
async def upload_report(
    file: UploadFile = File(...),
    familyMemberId: str | None = None,
    current_user: dict = CurrentUser,
) -> ReportRecord:
    await rate_limiter.enforce(current_user["_id"], "report_upload", settings.upload_limit_per_day)
    parsed = await parser.parse_upload(file)
    file_ref = storage.upload_bytes(parsed["file_key"], parsed["file_bytes"], parsed["mime_type"])
    user_age = None
    if current_user.get("dob"):
        dob = current_user["dob"]
        user_age = datetime.now(UTC).year - dob.year
    structured_dump = [item.model_dump() for item in parsed["structured_data"]]
    encrypted_payload = encryptor.encrypt_json({"structuredData": structured_dump})
    medications: list[dict] = []
    report_id = str(uuid4())
    try:
        if parsed["report_type"].value == "prescription":
            medications = (await ai.explain_prescription(current_user.get("preferredLanguage", "en"), parsed["sanitized_text"], [])).get(
                "medications",
                [],
            )
        explanation = await ai.explain_report(
            report_type=parsed["report_type"].value,
            language=current_user.get("preferredLanguage", "en"),
            age_years=user_age,
            biological_sex=current_user.get("biologicalSex"),
            structured_data=structured_dump,
        )
        explanation_payload = explanation.model_dump()
    except Exception:
        db = get_database()
        await db.analysis_queue.insert_one(await ai.queue_fallback_payload(report_id, current_user["_id"], "gemini_failed"))
        explanation_payload = {
            "parameterLevel": [],
            "holisticSummary": "AI analysis is temporarily unavailable. Your report has been saved and will be analyzed shortly.",
            "attentionScore": 1,
            "confidenceNote": "A follow-up explanation will be generated when analysis resumes.",
            "disclaimer": f"This saved {parsed['report_type'].value.replace('_', ' ')} report still needs clinician context.",
        }
    report = {
        "_id": report_id,
        "userId": current_user["_id"],
        "familyMemberId": familyMemberId,
        "reportType": parsed["report_type"].value,
        "reportDate": parsed["report_date"],
        "uploadDate": datetime.now(UTC),
        "labName": parsed["lab_name"],
        "fileRef": file_ref,
        "structuredData": encrypted_payload,
        "aiExplanation": explanation_payload,
        "language": current_user.get("preferredLanguage", "en"),
        "medications": medications,
        "chatHistory": [],
    }
    db = get_database()
    await db.reports.insert_one(report)
    hydrated = await hydrate_report(report)
    return ReportRecord(**hydrated)


@router.get("", response_model=list[ReportRecord])
async def list_reports(familyMemberId: str | None = None, current_user: dict = CurrentUser) -> list[ReportRecord]:
    db = get_database()
    query = {"userId": current_user["_id"]}
    if familyMemberId:
        query["familyMemberId"] = familyMemberId
    cursor = db.reports.find(query).sort("uploadDate", -1)
    reports: list[ReportRecord] = []
    async for item in cursor:
        reports.append(ReportRecord(**(await hydrate_report(item))))
    return reports


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(current_user: dict = CurrentUser) -> TrendsResponse:
    db = get_database()
    cursor = db.reports.find({"userId": current_user["_id"]})
    reports: list[dict] = []
    async for item in cursor:
        reports.append(await hydrate_report(item))
    return trend_service.build(reports)


@router.get("/{report_id}", response_model=ReportRecord)
async def get_report(report_id: str, current_user: dict = CurrentUser) -> ReportRecord:
    db = get_database()
    report = await db.reports.find_one({"_id": report_id, "userId": current_user["_id"]})
    if not report:
        raise HTTPException(status_code=404, detail={"error": "Report not found", "code": "REPORT_NOT_FOUND"})
    return ReportRecord(**(await hydrate_report(report)))


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: dict = CurrentUser) -> dict:
    db = get_database()
    report = await db.reports.find_one({"_id": report_id, "userId": current_user["_id"]})
    if not report:
        raise HTTPException(status_code=404, detail={"error": "Report not found", "code": "REPORT_NOT_FOUND"})
    if report.get("fileRef"):
        storage.delete_object(report["fileRef"])
    await db.reports.delete_one({"_id": report_id})
    await db.reminders.delete_many({"reportId": report_id})
    return {"message": "Report deleted"}


@router.post("/{report_id}/chat")
async def chat_about_report(report_id: str, payload: ReportChatRequest, current_user: dict = CurrentUser) -> dict:
    await rate_limiter.enforce(current_user["_id"], "report_chat", settings.chat_limit_per_day)
    db = get_database()
    report = await db.reports.find_one({"_id": report_id, "userId": current_user["_id"]})
    if not report:
        raise HTTPException(status_code=404, detail={"error": "Report not found", "code": "REPORT_NOT_FOUND"})
    hydrated = await hydrate_report(report)
    answer = await ai.answer_chat(
        report_type=hydrated["reportType"],
        language=hydrated["language"],
        structured_data=hydrated["structuredData"],
        chat_history=hydrated.get("chatHistory", []),
        message=payload.message,
    )
    entry_user = {"role": "user", "content": payload.message, "timestamp": datetime.now(UTC)}
    entry_ai = {"role": "assistant", "content": answer, "timestamp": datetime.now(UTC)}
    await db.reports.update_one(
        {"_id": report_id},
        {"$push": {"chatHistory": {"$each": [entry_user, entry_ai]}}},
    )
    return {"message": answer}


@router.get("/{report_id}/chat")
async def get_chat_history(report_id: str, current_user: dict = CurrentUser) -> dict:
    db = get_database()
    report = await db.reports.find_one({"_id": report_id, "userId": current_user["_id"]}, {"chatHistory": 1})
    if not report:
        raise HTTPException(status_code=404, detail={"error": "Report not found", "code": "REPORT_NOT_FOUND"})
    return {"chatHistory": report.get("chatHistory", [])}


@router.post("/{report_id}/summary", response_model=SummaryResponse)
async def generate_summary(report_id: str, current_user: dict = CurrentUser) -> SummaryResponse:
    db = get_database()
    report = await db.reports.find_one({"_id": report_id, "userId": current_user["_id"]})
    if not report:
        raise HTTPException(status_code=404, detail={"error": "Report not found", "code": "REPORT_NOT_FOUND"})
    hydrated = await hydrate_report(report)
    previous = await db.reports.find_one(
        {"userId": current_user["_id"], "reportType": hydrated["reportType"], "_id": {"$ne": report_id}},
        sort=[("reportDate", -1)],
    )
    previous_hydrated = await hydrate_report(previous) if previous else None
    return await ai.generate_summary(hydrated, previous_hydrated, hydrated["language"])


async def hydrate_report(report: dict | None) -> dict:
    if not report:
        return {}
    hydrated = dict(report)
    encrypted_structured = hydrated.get("structuredData", {})
    if encrypted_structured and isinstance(encrypted_structured, dict) and encrypted_structured.get("ciphertext"):
        decrypted = encryptor.decrypt_json(encrypted_structured)
        hydrated["structuredData"] = decrypted["structuredData"]
    return hydrated
