from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from . import settings


def healthcheck(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", healthcheck),
    path(f"{settings.API_V1_PREFIX.strip('/')}/", include("users.urls")),
    path(f"{settings.API_V1_PREFIX.strip('/')}/", include("reports.urls")),
    path(f"{settings.API_V1_PREFIX.strip('/')}/", include("reminders.urls")),
]
