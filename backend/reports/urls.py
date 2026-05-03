from django.urls import path

from reports.views import (
    ReportChatView,
    ReportDetailView,
    ReportListCreateView,
    ReportSummaryView,
    ReportTrendsView,
    ReportUploadView,
)


urlpatterns = [
    path("reports", ReportListCreateView.as_view()),
    path("reports/upload", ReportUploadView.as_view()),
    path("reports/trends", ReportTrendsView.as_view()),
    path("reports/<uuid:report_id>", ReportDetailView.as_view()),
    path("reports/<uuid:report_id>/chat", ReportChatView.as_view()),
    path("reports/<uuid:report_id>/summary", ReportSummaryView.as_view()),
]
