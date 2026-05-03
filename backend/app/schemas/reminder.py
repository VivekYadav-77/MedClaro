from datetime import datetime

from pydantic import BaseModel, Field


class ReminderCreate(BaseModel):
    reportId: str
    reminderDate: datetime


class ReminderRecord(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    reportId: str
    reminderDate: datetime
    sent: bool = False
    muted: bool = False

    model_config = {"populate_by_name": True}
