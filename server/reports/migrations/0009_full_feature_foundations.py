import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("circles", "0004_alter_circlemember_role"),
        ("reports", "0008_prescription_contextual_analysis"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="analysis_metadata",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="report",
            name="analysis_status",
            field=models.CharField(
                choices=[
                    ("uploaded", "Uploaded"),
                    ("extracting", "Extracting"),
                    ("analyzing", "Analyzing"),
                    ("completed", "Completed"),
                    ("failed", "Failed"),
                    ("fallback_used", "Fallback used"),
                ],
                default="completed",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="report",
            name="original_filename",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_type", models.CharField(max_length=80)),
                ("object_type", models.CharField(blank=True, default="", max_length=80)),
                ("object_id", models.CharField(blank=True, default="", max_length=80)),
                ("metadata", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="audit_events", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="DischargePlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source_name", models.CharField(blank=True, default="", max_length=255)),
                ("notes", models.TextField(blank=True, default="")),
                ("review_message", models.TextField(default="Review each item against the original discharge summary before acting.")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("circle", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="discharge_plans", to="circles.circle")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="discharge_plans", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-updated_at", "-created_at"]},
        ),
        migrations.CreateModel(
            name="GlobalChatSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(blank=True, default="Health assistant", max_length=120)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("circle", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="global_chat_sessions", to="circles.circle")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="global_chat_sessions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-updated_at", "-created_at"]},
        ),
        migrations.CreateModel(
            name="RemissionPathway",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("condition", models.CharField(choices=[("prediabetes", "Prediabetes"), ("fatty_liver", "Fatty liver"), ("hypertension", "Hypertension"), ("general", "General")], max_length=40)),
                ("title", models.CharField(max_length=120)),
                ("status", models.CharField(choices=[("active", "Active"), ("completed", "Completed"), ("paused", "Paused")], default="active", max_length=20)),
                ("start_date", models.DateTimeField(default=django.utils.timezone.now)),
                ("current_week", models.PositiveIntegerField(default=1)),
                ("progress_percent", models.PositiveIntegerField(default=8)),
                ("next_habit", models.CharField(blank=True, default="", max_length=255)),
                ("weekly_habits", models.JSONField(default=list)),
                ("marker_goals", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="remission_pathways", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["status", "condition"], "unique_together": {("user", "condition")}},
        ),
        migrations.CreateModel(
            name="ScreeningSchedule",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=120)),
                ("status", models.CharField(choices=[("due", "Due"), ("upcoming", "Upcoming"), ("done", "Done"), ("deferred", "Deferred"), ("not_applicable", "Not applicable"), ("needs_profile", "Needs profile")], default="upcoming", max_length=30)),
                ("due_date", models.DateTimeField(blank=True, null=True)),
                ("reason", models.TextField(blank=True, default="")),
                ("metadata", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="screening_schedules", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["status", "due_date", "title"], "unique_together": {("user", "title")}},
        ),
        migrations.CreateModel(
            name="DischargeTask",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=160)),
                ("detail", models.TextField(blank=True, default="")),
                ("status", models.CharField(choices=[("open", "Open"), ("done", "Done"), ("deferred", "Deferred")], default="open", max_length=20)),
                ("due_date", models.DateTimeField(blank=True, null=True)),
                ("assignee_name", models.CharField(blank=True, default="", max_length=120)),
                ("source", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="reports.dischargeplan")),
            ],
            options={"ordering": ["status", "due_date", "created_at"]},
        ),
        migrations.CreateModel(
            name="GlobalChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(max_length=20)),
                ("content", models.TextField()),
                ("health_context_snapshot", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="reports.globalchatsession")),
            ],
            options={"ordering": ["created_at", "id"]},
        ),
        migrations.CreateModel(
            name="PathwayLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("note", models.CharField(max_length=240)),
                ("logged_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("metadata", models.JSONField(default=dict)),
                ("pathway", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="logs", to="reports.remissionpathway")),
            ],
            options={"ordering": ["-logged_at", "-id"]},
        ),
    ]
