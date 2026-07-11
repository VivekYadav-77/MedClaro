from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import JournalEntry, LifestylePlan, SymptomLog
from .serializers import (
    JournalEntrySerializer,
    LifestylePlanCreateSerializer,
    LifestylePlanSerializer,
    SymptomLogSerializer,
)
from .services import search_journal


class SymptomLogViewSet(ModelViewSet):
    serializer_class = SymptomLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SymptomLog.objects.filter(owner=self.request.user)


class JournalEntryViewSet(ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return search_journal(self.request.user, query)


class LifestylePlanViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return LifestylePlan.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return LifestylePlanCreateSerializer
        return LifestylePlanSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save()
        return Response(LifestylePlanSerializer(plan).data, status=201)
