from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser
from app.core.database import get_database
from app.schemas.user import UserProfile, UserUpdate
from app.services.encryption import EncryptionService
from app.services.storage import StorageService


router = APIRouter(prefix="/users", tags=["users"])
encryptor = EncryptionService()
storage = StorageService()


def hydrate_user(user: dict) -> dict:
    hydrated = dict(user)
    if isinstance(hydrated.get("email"), dict) and hydrated["email"].get("ciphertext"):
        hydrated["email"] = encryptor.decrypt_json(hydrated["email"]).get("value", "")
    return hydrated


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = CurrentUser) -> UserProfile:
    return UserProfile(**hydrate_user(current_user))


@router.put("/me", response_model=UserProfile)
async def update_me(payload: UserUpdate, current_user: dict = CurrentUser) -> UserProfile:
    update_doc = {key: value for key, value in payload.model_dump(exclude_none=True).items()}
    if not update_doc:
        return UserProfile(**hydrate_user(current_user))
    db = get_database()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_doc})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return UserProfile(**hydrate_user(updated))


@router.delete("/me")
async def delete_me(current_user: dict = CurrentUser) -> dict:
    db = get_database()
    cursor = db.reports.find({"userId": current_user["_id"]})
    async for report in cursor:
        if report.get("fileRef"):
            storage.delete_object(report["fileRef"])
    await db.reminders.delete_many({"userId": current_user["_id"]})
    await db.reports.delete_many({"userId": current_user["_id"]})
    result = await db.users.delete_one({"_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"error": "User not found", "code": "USER_NOT_FOUND"})
    return {"message": "Account deleted"}
