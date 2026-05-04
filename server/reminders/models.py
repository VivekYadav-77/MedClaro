import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Reminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reminders", on_delete=models.CASCADE)
    report = models.ForeignKey("reports.Report", related_name="reminders", on_delete=models.CASCADE)
    reminder_date = models.DateTimeField()
    sent = models.BooleanField(default=False)
    muted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-reminder_date"]
