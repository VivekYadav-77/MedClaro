from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_release_readiness_plan


class ReleaseReadinessPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        return Response(build_release_readiness_plan())
