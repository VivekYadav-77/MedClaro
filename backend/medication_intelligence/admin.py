from django.contrib import admin

from .models import (
    Medication,
    MedicationSchedule,
    MedicationWarning,
    PrescriptionAnalysis,
)


class MedicationInline(admin.TabularInline):
    model = Medication
    extra = 0


class WarningInline(admin.TabularInline):
    model = MedicationWarning
    extra = 0


@admin.register(PrescriptionAnalysis)
class PrescriptionAnalysisAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "document", "status", "is_expired", "created_at"]
    list_filter = ["status", "is_expired", "safety_review_required"]
    search_fields = ["document__title", "owner__username", "source_document_reference"]
    inlines = [MedicationInline, WarningInline]


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ["brand_name", "active_ingredient", "strength", "owner", "analysis"]
    search_fields = ["brand_name", "active_ingredient", "owner__username"]


@admin.register(MedicationSchedule)
class MedicationScheduleAdmin(admin.ModelAdmin):
    list_display = ["medication", "dosage", "frequency", "reminder_status"]
    list_filter = ["reminder_status"]


@admin.register(MedicationWarning)
class MedicationWarningAdmin(admin.ModelAdmin):
    list_display = ["title", "warning_type", "severity", "analysis"]
    list_filter = ["warning_type", "severity"]

# Register your models here.
