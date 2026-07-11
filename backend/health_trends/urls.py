from django.urls import path

from .views import BiomarkerTrendView, ReportHistoryView, TimelineView, TrendInsightView

urlpatterns = [
    path("reports/", ReportHistoryView.as_view(), name="trend-report-history"),
    path("timeline/", TimelineView.as_view(), name="trend-timeline"),
    path("biomarkers/", BiomarkerTrendView.as_view(), name="trend-biomarkers"),
    path("insights/", TrendInsightView.as_view(), name="trend-insights"),
]
