from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.common import BiologicalSex, Language


class SettingsPayload(BaseModel):
    notifications: bool = True
    nudges: bool = True


class FamilyMemberBase(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=60)
    relationship: str = Field(min_length=1, max_length=40)
    dob: datetime
    biologicalSex: BiologicalSex


class FamilyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    relationship: str = Field(min_length=1, max_length=40)
    dob: datetime
    biologicalSex: BiologicalSex


class UserProfile(BaseModel):
    id: str = Field(alias="_id")
    googleId: str
    email: EmailStr
    name: str
    dob: datetime | None = None
    biologicalSex: BiologicalSex | None = None
    preferredLanguage: Language = Language.english
    familyMembers: list[FamilyMemberBase] = []
    settings: SettingsPayload = SettingsPayload()
    createdAt: datetime
    deletedAt: datetime | None = None

    model_config = {"populate_by_name": True}


class UserUpdate(BaseModel):
    name: str | None = None
    dob: datetime | None = None
    biologicalSex: BiologicalSex | None = None
    preferredLanguage: Language | None = None
    settings: SettingsPayload | None = None
