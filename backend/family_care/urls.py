from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DoctorSummaryViewSet,
    EmergencyProfileShareViewSet,
    FamilyCircleViewSet,
    FamilyDashboardView,
)

router = DefaultRouter()
router.register("circles", FamilyCircleViewSet, basename="family-circle")
router.register("doctor-summaries", DoctorSummaryViewSet, basename="doctor-summary")
router.register("emergency-shares", EmergencyProfileShareViewSet, basename="emergency-share")

urlpatterns = [
    path("dashboard/", FamilyDashboardView.as_view(), name="family-dashboard"),
    path("", include(router.urls)),
]
