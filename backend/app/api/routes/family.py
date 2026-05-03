from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.database import get_database
from app.schemas.user import FamilyMemberBase, FamilyMemberCreate


router = APIRouter(prefix="/family", tags=["family"])


@router.get("", response_model=list[FamilyMemberBase])
async def list_family(current_user: dict = CurrentUser) -> list[FamilyMemberBase]:
    return [FamilyMemberBase(**item) for item in current_user.get("familyMembers", [])]


@router.post("", response_model=FamilyMemberBase)
async def add_family_member(payload: FamilyMemberCreate, current_user: dict = CurrentUser) -> FamilyMemberBase:
    existing = current_user.get("familyMembers", [])
    if len(existing) >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "You can add up to 5 family profiles", "code": "FAMILY_LIMIT_REACHED"},
        )
    member = FamilyMemberBase(id=str(uuid4()), **payload.model_dump())
    db = get_database()
    await db.users.update_one({"_id": current_user["_id"]}, {"$push": {"familyMembers": member.model_dump()}})
    return member


@router.delete("/{member_id}")
async def remove_family_member(member_id: str, current_user: dict = CurrentUser) -> dict:
    db = get_database()
    await db.users.update_one({"_id": current_user["_id"]}, {"$pull": {"familyMembers": {"id": member_id}}})
    await db.reports.delete_many({"userId": current_user["_id"], "familyMemberId": member_id})
    return {"message": "Family member removed"}
