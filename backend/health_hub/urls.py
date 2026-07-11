from django.urls import path

from .views import (
    AssistantConversationDetailView,
    AssistantConversationListView,
    AssistantTurnView,
    DashboardView,
    MemoryContextView,
)

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="health-hub-dashboard"),
    path("memory-context/", MemoryContextView.as_view(), name="health-hub-memory-context"),
    path("assistant/conversations/", AssistantConversationListView.as_view(), name="assistant-conversations"),
    path("assistant/conversations/<int:pk>/", AssistantConversationDetailView.as_view(), name="assistant-conversation-detail"),
    path("assistant/turns/", AssistantTurnView.as_view(), name="assistant-turns"),
]
