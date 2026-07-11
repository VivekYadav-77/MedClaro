from django.urls import path

from .views import (
    AccessibilityPlanView,
    LocalizedContentArtifactListCreateView,
    PreferenceView,
    SimplifiedDashboardView,
    VoiceSummaryArtifactListCreateView,
)

urlpatterns = [
    path("preferences/", PreferenceView.as_view(), name="accessibility-preferences"),
    path("plan/", AccessibilityPlanView.as_view(), name="accessibility-plan"),
    path("simplified-dashboard/", SimplifiedDashboardView.as_view(), name="simplified-dashboard"),
    path("localized-content/", LocalizedContentArtifactListCreateView.as_view(), name="localized-content"),
    path("voice-summaries/", VoiceSummaryArtifactListCreateView.as_view(), name="voice-summaries"),
]
