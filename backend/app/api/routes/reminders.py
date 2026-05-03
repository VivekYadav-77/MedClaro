from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser
from app.core.database import get_database
from app.schemas.reminder import ReminderCreate, ReminderRecord


router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("", response_model=ReminderRecord)
async def create_reminder(payload: ReminderCreate, current_user: dict = CurrentUser) -> ReminderRecord:
    db = get_database()
    reminder = {
        "_id": str(uuid4()),
        "userId": current_user["_id"],
        "reportId": payload.reportId,
        "reminderDate": payload.reminderDate,
        "sent": False,
        "muted": False,
    }
    await db.reminders.insert_one(reminder)
    return ReminderRecord(**reminder)


@router.put("/{reminder_id}/mute")
async def mute_reminder(reminder_id: str, current_user: dict = CurrentUser) -> dict:
    db = get_database()
    result = await db.reminders.update_one(
        {"_id": reminder_id, "userId": current_user["_id"]},
        {"$set": {"muted": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail={"error": "Reminder not found", "code": "REMINDER_NOT_FOUND"})
    return {"message": "Reminder muted"}
