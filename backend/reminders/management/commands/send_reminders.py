from django.core.management.base import BaseCommand
from django.utils import timezone

from reminders.models import Reminder


class Command(BaseCommand):
    help = "Dispatch due reminders and mark them as sent."

    def handle(self, *args, **options):
        due_reminders = (
            Reminder.objects.select_related("user", "report")
            .filter(reminder_date__lte=timezone.now(), sent=False, muted=False)
            .order_by("reminder_date")
        )
        count = 0

        for reminder in due_reminders:
            self.stdout.write(
                f"Reminder due for user={reminder.user_id} report={reminder.report_id} date={reminder.reminder_date.isoformat()}"
            )
            reminder.sent = True
            reminder.save(update_fields=["sent"])
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {count} reminder(s)."))
