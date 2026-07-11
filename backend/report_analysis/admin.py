from django.contrib import admin

from .models import BiomarkerResult, ReportAnalysis


class BiomarkerInline(admin.TabularInline):
    model = BiomarkerResult
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(ReportAnalysis)
class ReportAnalysisAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "owner",
        "document",
        "status",
        "health_status",
        "health_score",
        "created_at",
    ]
    list_filter = ["status", "health_status", "safety_review_required"]
    search_fields = ["document__title", "owner__username", "source_document_reference"]
    inlines = [BiomarkerInline]


@admin.register(BiomarkerResult)
class BiomarkerResultAdmin(admin.ModelAdmin):
    list_display = ["name", "analysis", "value", "unit", "status", "severity"]
    list_filter = ["status", "severity"]
    search_fields = ["name", "code", "analysis__document__title"]
