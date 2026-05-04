from django.urls import path

from reminders.views import ReminderCreateView, ReminderMuteView


urlpatterns = [
    path("reminders", ReminderCreateView.as_view()),
    path("reminders/<uuid:reminder_id>/mute", ReminderMuteView.as_view()),
]
