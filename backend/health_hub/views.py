from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AssistantConversation
from .serializers import AssistantConversationSerializer, AssistantTurnSerializer
from .services import build_assistant_context, build_dashboard, create_assistant_turn


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard(request.user))


class MemoryContextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_assistant_context(request.user))


class AssistantConversationListView(ListAPIView):
    serializer_class = AssistantConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssistantConversation.objects.filter(owner=self.request.user).prefetch_related("messages")


class AssistantConversationDetailView(RetrieveAPIView):
    serializer_class = AssistantConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssistantConversation.objects.filter(owner=self.request.user).prefetch_related("messages")


class AssistantTurnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AssistantTurnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = create_assistant_turn(
            owner=request.user,
            message=serializer.validated_data["message"],
            conversation_id=serializer.validated_data.get("conversation_id"),
        )
        return Response(AssistantConversationSerializer(conversation).data, status=201)
