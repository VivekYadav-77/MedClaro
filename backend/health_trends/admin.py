from django.contrib import admin

from .models import TimelineEvent, TrendInsight


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "title", "owner", "event_date", "source_type"]
    list_filter = ["event_type", "event_date"]
    search_fields = ["title", "summary", "owner__username"]


@admin.register(TrendInsight)
class TrendInsightAdmin(admin.ModelAdmin):
    list_display = ["biomarker_name", "owner", "label", "report_count", "latest_value", "unit"]
    list_filter = ["label", "generated_at"]
    search_fields = ["biomarker_name", "biomarker_code", "owner__username"]

# Register your models here.
