from collections import defaultdict

from app.schemas.report import TrendPoint, TrendSeries, TrendsResponse


class TrendService:
    def build(self, reports: list[dict]) -> TrendsResponse:
        grouped: dict[str, list[TrendPoint]] = defaultdict(list)
        units: dict[str, str] = {}
        composite_score: list[dict] = []
        seasonal_insights: list[str] = []
        sorted_reports = sorted(reports, key=lambda report: report.get("reportDate") or report["uploadDate"])
        for report in sorted_reports:
            flagged_count = sum(1 for item in report["structuredData"] if item.get("flag") in {"high", "low"})
            total = max(len(report["structuredData"]), 1)
            composite_score.append(
                {
                    "date": report.get("reportDate") or report["uploadDate"],
                    "score": round(100 - ((flagged_count / total) * 60), 1),
                }
            )
            for item in report["structuredData"]:
                if item.get("normalizedValue") is None or not item.get("normalizedUnit"):
                    continue
                grouped[item["testName"]].append(
                    TrendPoint(
                        date=report.get("reportDate") or report["uploadDate"],
                        value=item["normalizedValue"],
                        low=item.get("referenceRangeLow"),
                        high=item.get("referenceRangeHigh"),
                    )
                )
                units[item["testName"]] = item.get("normalizedUnit") or "standard"
        series: list[TrendSeries] = []
        for parameter, points in grouped.items():
            if len(points) < 2:
                continue
            first, last = points[0], points[-1]
            delta = round(((last.value - first.value) / first.value) * 100, 1) if first.value else 0
            direction = "↑" if delta >= 0 else "↓"
            summary = f"Your {parameter} has {'risen' if delta >= 0 else 'declined'} across {len(points)} reports."
            series.append(
                TrendSeries(
                    parameter=parameter,
                    normalizedUnit=units.get(parameter, "standard"),
                    trendSummary=summary,
                    deltaText=f"{direction} {abs(delta)}% vs first report",
                    points=points,
                )
            )
            months = {point.date.month for point in points}
            if len(points) >= 3 and len(months) >= 3:
                seasonal_insights.append(f"{parameter} shows enough history to inspect seasonal movement over time.")
        return TrendsResponse(
            reportCount=len(reports),
            compositeScore=composite_score,
            seasonalInsights=seasonal_insights,
            series=series,
        )
