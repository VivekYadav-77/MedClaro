from django.urls import path

from reports.views import (
    GlobalChatView,
    ReportDietAdviceView,
    ReportChatView,
    ReportDetailView,
    ReportListCreateView,
    MedicationConflictView,
    ReportSummaryView,
    ReportTrendsView,
    ReportUploadView,
    TreatmentEffectivenessView,
)


urlpatterns = [
    path("reports", ReportListCreateView.as_view()),
    path("reports/chat", GlobalChatView.as_view()),
    path("reports/medication-conflicts", MedicationConflictView.as_view()),
    path("reports/treatment-effectiveness", TreatmentEffectivenessView.as_view()),
    path("reports/upload", ReportUploadView.as_view()),
    path("reports/trends", ReportTrendsView.as_view()),
    path("reports/<uuid:report_id>", ReportDetailView.as_view()),
    path("reports/<uuid:report_id>/chat", ReportChatView.as_view()),
    path("reports/<uuid:report_id>/diet-advice", ReportDietAdviceView.as_view()),
    path("reports/<uuid:report_id>/summary", ReportSummaryView.as_view()),
]
