from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReportAnalysisViewSet

router = DefaultRouter()
router.register("", ReportAnalysisViewSet, basename="report-analysis")

urlpatterns = [path("", include(router.urls))]
