from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HealthProfileViewSet

router = DefaultRouter()
router.register("", HealthProfileViewSet, basename="health-profile")

urlpatterns = [path("", include(router.urls))]
