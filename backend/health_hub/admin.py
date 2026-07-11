from django.contrib import admin

from .models import AssistantConversation, AssistantMessage


class AssistantMessageInline(admin.TabularInline):
    model = AssistantMessage
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(AssistantConversation)
class AssistantConversationAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "model_name", "safety_review_required", "updated_at"]
    list_filter = ["safety_review_required", "model_name"]
    search_fields = ["title", "owner__username"]
    inlines = [AssistantMessageInline]


@admin.register(AssistantMessage)
class AssistantMessageAdmin(admin.ModelAdmin):
    list_display = ["conversation", "role", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["content", "conversation__title", "conversation__owner__username"]

# Register your models here.
