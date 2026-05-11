from django.urls import path

from reports.views import (
    EmergencyCardAccessView,
    EmergencySosView,
    GlobalChatView,
    IntegrationStatusView,
    ReportDietAdviceView,
    ReportChatView,
    ReportDetailView,
    ReportListCreateView,
    ReportShareView,
    MedicationConflictView,
    ReportSummaryView,
    ReportTrendsView,
    ReportUploadView,
    TreatmentEffectivenessView,
    WearableMetricImportView,
)


urlpatterns = [
    path("emergency/sos", EmergencySosView.as_view()),
    path("emergency-card/<uuid:event_id>/access", EmergencyCardAccessView.as_view()),
    path("integrations/status", IntegrationStatusView.as_view()),
    path("reports", ReportListCreateView.as_view()),
    path("reports/chat", GlobalChatView.as_view()),
    path("reports/medication-conflicts", MedicationConflictView.as_view()),
    path("reports/treatment-effectiveness", TreatmentEffectivenessView.as_view()),
    path("reports/upload", ReportUploadView.as_view()),
    path("reports/trends", ReportTrendsView.as_view()),
    path("reports/<uuid:report_id>", ReportDetailView.as_view()),
    path("reports/<uuid:report_id>/chat", ReportChatView.as_view()),
    path("reports/<uuid:report_id>/diet-advice", ReportDietAdviceView.as_view()),
    path("reports/<uuid:report_id>/shares", ReportShareView.as_view()),
    path("reports/<uuid:report_id>/summary", ReportSummaryView.as_view()),
    path("wearables/import", WearableMetricImportView.as_view()),
]
