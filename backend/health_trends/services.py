import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from django.db import transaction

from ai_services.gemini_config import GEMINI_MODULES
from report_analysis.models import BiomarkerResult, ReportAnalysis

from .models import TimelineEvent, TrendInsight


PROMPT_VERSION = "trend-analysis-v1"
VALUE_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")


@dataclass(frozen=True)
class BiomarkerPoint:
    analysis_id: int
    date: date
    value: float
    status: str
    document_title: str


def refresh_timeline_events(owner) -> list[TimelineEvent]:
    analyses = (
        ReportAnalysis.objects.filter(
            owner=owner,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
        )
        .select_related("document")
        .prefetch_related("biomarkers")
    )
    events = []
    for analysis in analyses:
        event_date = analysis.document.source_date or analysis.completed_at.date()
        abnormal_count = analysis.biomarkers.exclude(
            status=BiomarkerResult.MarkerStatus.NORMAL
        ).count()
        event, _created = TimelineEvent.objects.update_or_create(
            owner=owner,
            source_type="report_analysis",
            source_id=analysis.id,
            event_type=TimelineEvent.EventType.REPORT,
            defaults={
                "title": analysis.document.title,
                "summary": (
                    f"Health score {analysis.health_score}, "
                    f"{analysis.health_status.replace('_', ' ')}; "
                    f"{abnormal_count} abnormal biomarkers."
                ),
                "event_date": event_date,
                "report_analysis": analysis,
                "tags": [
                    "report",
                    analysis.health_status,
                    *sorted(
                        set(
                            analysis.biomarkers.values_list(
                                "name",
                                flat=True,
                            )
                        )
                    ),
                ],
                "metadata": {
                    "health_score": analysis.health_score,
                    "health_status": analysis.health_status,
                    "abnormal_biomarker_count": abnormal_count,
                    "document_id": analysis.document_id,
                },
            },
        )
        events.append(event)
    return events


@transaction.atomic
def refresh_trend_insights(owner) -> list[TrendInsight]:
    refresh_timeline_events(owner)
    grouped = _biomarker_history(owner)
    insights = []

    for key, points in grouped.items():
        biomarker_name, biomarker_code, unit = key
        points.sort(key=lambda item: item.date)
        label = _trend_label(points)
        first_value = points[0].value if points else None
        latest_value = points[-1].value if points else None
        delta = (
            round(latest_value - first_value, 2)
            if first_value is not None and latest_value is not None
            else None
        )
        graph_points = [
            {
                "date": item.date.isoformat(),
                "value": item.value,
                "status": item.status,
                "analysis_id": item.analysis_id,
                "document_title": item.document_title,
            }
            for item in points
        ]

        insight, _created = TrendInsight.objects.update_or_create(
            owner=owner,
            biomarker_name=biomarker_name,
            biomarker_code=biomarker_code,
            defaults={
                "unit": unit,
                "label": label,
                "report_count": len(points),
                "first_value": first_value,
                "latest_value": latest_value,
                "delta": delta,
                "graph_points": graph_points,
                "risk_awareness": _risk_awareness(label, biomarker_name, len(points)),
                "doctor_prompts": _doctor_prompts(label, biomarker_name),
                "model_name": GEMINI_MODULES["trends"].model,
                "prompt_version": PROMPT_VERSION,
            },
        )
        insights.append(insight)

    return insights


def get_report_history(owner) -> list[dict]:
    analyses = (
        ReportAnalysis.objects.filter(owner=owner)
        .select_related("document")
        .prefetch_related("biomarkers")
    )
    return [
        {
            "id": analysis.id,
            "document_id": analysis.document_id,
            "document_title": analysis.document.title,
            "source_date": (
                analysis.document.source_date.isoformat()
                if analysis.document.source_date
                else None
            ),
            "created_at": analysis.created_at,
            "health_score": analysis.health_score,
            "health_status": analysis.health_status,
            "biomarker_count": analysis.biomarkers.count(),
            "abnormal_biomarker_count": analysis.biomarkers.exclude(
                status=BiomarkerResult.MarkerStatus.NORMAL
            ).count(),
        }
        for analysis in analyses
    ]


def _biomarker_history(owner) -> dict[tuple[str, str, str], list[BiomarkerPoint]]:
    biomarkers = (
        BiomarkerResult.objects.filter(
            analysis__owner=owner,
            analysis__status=ReportAnalysis.ProcessingStatus.COMPLETED,
        )
        .select_related("analysis", "analysis__document")
        .order_by("analysis__document__source_date", "analysis__created_at")
    )
    grouped = defaultdict(list)
    for biomarker in biomarkers:
        numeric_value = _parse_numeric_value(biomarker.value)
        if numeric_value is None:
            continue
        event_date = biomarker.analysis.document.source_date or biomarker.analysis.completed_at.date()
        key = (biomarker.name, biomarker.code, biomarker.unit)
        grouped[key].append(
            BiomarkerPoint(
                analysis_id=biomarker.analysis_id,
                date=event_date,
                value=numeric_value,
                status=biomarker.status,
                document_title=biomarker.analysis.document.title,
            )
        )
    return grouped


def _parse_numeric_value(value: str) -> float | None:
    match = VALUE_PATTERN.search(value)
    if not match:
        return None
    return float(match.group())


def _trend_label(points: list[BiomarkerPoint]) -> str:
    if len(points) < 2:
        return TrendInsight.TrendLabel.INSUFFICIENT_DATA

    deltas = [
        points[index].value - points[index - 1].value
        for index in range(1, len(points))
    ]
    meaningful = [delta for delta in deltas if abs(delta) >= 0.01]
    if not meaningful:
        return TrendInsight.TrendLabel.STABLE

    has_up = any(delta > 0 for delta in meaningful)
    has_down = any(delta < 0 for delta in meaningful)
    if has_up and has_down:
        return TrendInsight.TrendLabel.FLUCTUATING
    if has_down:
        return TrendInsight.TrendLabel.IMPROVING
    return TrendInsight.TrendLabel.WORSENING


def _risk_awareness(label: str, biomarker_name: str, report_count: int) -> list[str]:
    if report_count < 2:
        return [
            "There is not enough history to describe a trend yet.",
            "Risk awareness is non-diagnostic and should be reviewed with a clinician.",
        ]
    if label == TrendInsight.TrendLabel.WORSENING:
        return [
            f"{biomarker_name} is moving in a direction that may deserve follow-up.",
            "This does not diagnose a condition; it highlights a pattern to discuss with a doctor.",
        ]
    if label == TrendInsight.TrendLabel.IMPROVING:
        return [
            f"{biomarker_name} is moving in a more favorable direction across available reports.",
            "This does not diagnose improvement or rule out risk; keep reviewing trends with a clinician.",
        ]
    if label == TrendInsight.TrendLabel.FLUCTUATING:
        return [
            f"{biomarker_name} has moved up and down across reports.",
            "Ask whether timing, fasting status, illness, or medication changes could explain variation.",
        ]
    return [
        f"{biomarker_name} appears relatively stable across available reports.",
        "This does not diagnose health status; stable trends can still need review if values remain outside the reference range.",
    ]


def _doctor_prompts(label: str, biomarker_name: str) -> list[str]:
    prompts = [
        f"What target range should I use for {biomarker_name} based on my profile?",
        f"When should I repeat {biomarker_name} testing?",
    ]
    if label in {
        TrendInsight.TrendLabel.WORSENING,
        TrendInsight.TrendLabel.FLUCTUATING,
    }:
        prompts.append(
            f"Could medicines, diet, sleep, illness, or family history explain this {biomarker_name} trend?"
        )
    return prompts
