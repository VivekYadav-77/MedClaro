from django.contrib import admin

from .models import (
    DoctorSummary,
    EmergencyProfileShare,
    FamilyAccessAudit,
    FamilyCircle,
    FamilyInvitation,
    FamilyMembership,
    PermissionGrant,
)


class MembershipInline(admin.TabularInline):
    model = FamilyMembership
    extra = 0


class PermissionInline(admin.TabularInline):
    model = PermissionGrant
    extra = 0


@admin.register(FamilyCircle)
class FamilyCircleAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "owner__username"]
    inlines = [MembershipInline]


@admin.register(FamilyMembership)
class FamilyMembershipAdmin(admin.ModelAdmin):
    list_display = ["display_name", "circle", "role", "status", "email"]
    list_filter = ["role", "status"]
    search_fields = ["display_name", "email", "circle__name"]
    inlines = [PermissionInline]


@admin.register(PermissionGrant)
class PermissionGrantAdmin(admin.ModelAdmin):
    list_display = ["membership", "permission", "is_allowed", "expires_at"]
    list_filter = ["permission", "is_allowed"]


@admin.register(FamilyInvitation)
class FamilyInvitationAdmin(admin.ModelAdmin):
    list_display = ["circle", "membership", "status", "expires_at"]
    list_filter = ["status"]


@admin.register(FamilyAccessAudit)
class FamilyAccessAuditAdmin(admin.ModelAdmin):
    list_display = ["action", "circle", "actor", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["summary", "circle__name", "actor__username"]


@admin.register(DoctorSummary)
class DoctorSummaryAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "model_name", "generated_at"]
    search_fields = ["title", "owner__username"]


@admin.register(EmergencyProfileShare)
class EmergencyProfileShareAdmin(admin.ModelAdmin):
    list_display = ["label", "owner", "is_active", "expires_at", "last_accessed_at"]
    list_filter = ["is_active", "expires_at"]
    search_fields = ["label", "owner__username", "token"]

# Register your models here.
