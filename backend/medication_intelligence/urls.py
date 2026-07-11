from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicationViewSet, PrescriptionAnalysisViewSet

router = DefaultRouter()
router.register("analyses", PrescriptionAnalysisViewSet, basename="prescription-analysis")
router.register("medications", MedicationViewSet, basename="medication")

urlpatterns = [path("", include(router.urls))]
