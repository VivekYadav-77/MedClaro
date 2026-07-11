from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JournalEntryViewSet, LifestylePlanViewSet, SymptomLogViewSet

router = DefaultRouter()
router.register("symptoms", SymptomLogViewSet, basename="symptom-log")
router.register("journal", JournalEntryViewSet, basename="journal-entry")
router.register("plans", LifestylePlanViewSet, basename="lifestyle-plan")

urlpatterns = [path("", include(router.urls))]
