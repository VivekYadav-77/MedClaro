from django.contrib import admin

from .models import (
    Allergy,
    EmergencyContact,
    FamilyHistoryItem,
    HealthProfile,
    KnownCondition,
    ProfileAuditEvent,
)


class AllergyInline(admin.TabularInline):
    model = Allergy
    extra = 0


class KnownConditionInline(admin.TabularInline):
    model = KnownCondition
    extra = 0


class FamilyHistoryItemInline(admin.TabularInline):
    model = FamilyHistoryItem
    extra = 0


class EmergencyContactInline(admin.TabularInline):
    model = EmergencyContact
    extra = 0


@admin.register(HealthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "age", "gender", "blood_group", "completion_percentage"]
    search_fields = ["user__username", "user__email", "location"]
    inlines = [
        AllergyInline,
        KnownConditionInline,
        FamilyHistoryItemInline,
        EmergencyContactInline,
    ]


@admin.register(ProfileAuditEvent)
class ProfileAuditEventAdmin(admin.ModelAdmin):
    list_display = ["profile", "actor", "action", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["summary", "actor__username"]
