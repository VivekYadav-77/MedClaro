from django.urls import path

from .views import ReleaseReadinessPlanView


urlpatterns = [
    path("plan/", ReleaseReadinessPlanView.as_view(), name="release-readiness-plan"),
]
