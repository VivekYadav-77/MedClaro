from django.contrib import admin

from .models import JournalEntry, LifestylePlan, SymptomLog


@admin.register(SymptomLog)
class SymptomLogAdmin(admin.ModelAdmin):
    list_display = ["symptom", "owner", "severity", "started_at", "doctor_consultation_recommended"]
    list_filter = ["severity", "doctor_consultation_recommended"]
    search_fields = ["symptom", "notes", "owner__username"]


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ["entry_date", "title", "owner", "mood", "stress"]
    list_filter = ["entry_date", "mood", "stress"]
    search_fields = ["title", "notes", "owner__username"]


@admin.register(LifestylePlan)
class LifestylePlanAdmin(admin.ModelAdmin):
    list_display = ["title", "plan_type", "owner", "model_name", "generated_at"]
    list_filter = ["plan_type", "generated_at"]
    search_fields = ["title", "summary", "owner__username"]

# Register your models here.
