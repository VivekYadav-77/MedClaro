from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(_request):
    return Response(
        {
            "status": "ok",
            "service": "medclaro-api",
            "version": "v1",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/profiles/", include("health_profiles.urls")),
    path("api/v1/documents/", include("documents.urls")),
    path("api/v1/report-analyses/", include("report_analysis.urls")),
    path("api/v1/health-trends/", include("health_trends.urls")),
]
