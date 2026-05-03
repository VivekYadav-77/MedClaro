from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import Language, ReportType


class StructuredParameter(BaseModel):
    testName: str
    value: float | str
    unit: str
    normalizedValue: float | None = None
    normalizedUnit: str | None = None
    referenceRangeLow: float | None = None
    referenceRangeHigh: float | None = None
    flag: str = "normal"


class ParameterExplanation(BaseModel):
    parameter: str
    explanation: str
    confidence: str


class AIExplanation(BaseModel):
    parameterLevel: list[ParameterExplanation] = []
    holisticSummary: str = ""
    attentionScore: int = 1
    confidenceNote: str = ""
    disclaimer: str = ""


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ReportRecord(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    familyMemberId: str | None = None
    reportType: ReportType
    reportDate: datetime | None = None
    uploadDate: datetime
    labName: str | None = None
    fileRef: str
    structuredData: list[StructuredParameter]
    aiExplanation: AIExplanation
    language: Language
    medications: list[dict] = []
    chatHistory: list[ChatMessage] = []

    model_config = {"populate_by_name": True}


class ReportChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1200)


class SummaryResponse(BaseModel):
    summaryMarkdown: str
    doctorQuestions: list[str]
    shareText: str


class TrendPoint(BaseModel):
    date: datetime
    value: float
    low: float | None = None
    high: float | None = None


class TrendSeries(BaseModel):
    parameter: str
    normalizedUnit: str
    trendSummary: str
    deltaText: str
    points: list[TrendPoint]


class TrendsResponse(BaseModel):
    reportCount: int
    compositeScore: list[dict]
    seasonalInsights: list[str]
    series: list[TrendSeries]
