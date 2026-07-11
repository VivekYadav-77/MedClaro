from django.contrib import admin

from .models import DocumentAuditEvent, MedicalDocument


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "owner",
        "document_type",
        "status",
        "size_bytes",
        "created_at",
    ]
    list_filter = ["document_type", "status", "is_deleted", "created_at"]
    search_fields = ["title", "original_filename", "owner__username", "owner__email"]
    readonly_fields = [
        "original_filename",
        "content_type",
        "size_bytes",
        "analysis_handoff",
        "created_at",
        "updated_at",
    ]


@admin.register(DocumentAuditEvent)
class DocumentAuditEventAdmin(admin.ModelAdmin):
    list_display = ["document", "actor", "action", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["document__title", "summary", "actor__username"]
