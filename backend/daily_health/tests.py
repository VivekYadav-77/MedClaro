from datetime import date

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from health_profiles.models import HealthProfile
from health_trends.models import TimelineEvent

from .models import JournalEntry, LifestylePlan, SymptomLog


User = get_user_model()


class DailyHealthApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="daily-user",
            email="daily@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        HealthProfile.objects.create(
            user=self.user,
            age=35,
            gender=HealthProfile.Gender.FEMALE,
            food_preference=HealthProfile.FoodPreference.VEGETARIAN,
            privacy_consent=True,
        )

    def test_create_symptom_log_adds_safety_and_timeline(self):
        response = self.client.post(
            "/api/v1/daily-health/symptoms/",
            {
                "symptom": "chest pain",
                "severity": "severe",
                "pain_level": 8,
                "started_at": timezone.now().isoformat(),
                "triggers": ["exercise"],
                "notes": "Started after climbing stairs.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["doctor_consultation_recommended"])
        self.assertTrue(response.data["safety_notes"])
        self.assertTrue(
            TimelineEvent.objects.filter(
                owner=self.user,
                event_type=TimelineEvent.EventType.SYMPTOM,
                source_type="symptom_log",
            ).exists()
        )

    def test_create_journal_entry_adds_timeline_and_search(self):
        response = self.client.post(
            "/api/v1/daily-health/journal/",
            {
                "entry_date": date(2026, 7, 11).isoformat(),
                "title": "Low energy day",
                "notes": "Felt tired after poor sleep.",
                "mood": 5,
                "stress": 7,
                "sleep_hours": "5.50",
                "energy": 4,
                "water_ml": 1600,
                "tags": ["sleep", "fatigue"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            TimelineEvent.objects.filter(
                owner=self.user,
                event_type=TimelineEvent.EventType.JOURNAL,
                source_type="journal_entry",
            ).exists()
        )

        search_response = self.client.get("/api/v1/daily-health/journal/?q=fatigue")
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(len(search_response.data), 1)

    def test_generate_diet_and_exercise_plans(self):
        diet_response = self.client.post(
            "/api/v1/daily-health/plans/",
            {"plan_type": "diet"},
            format="json",
        )
        exercise_response = self.client.post(
            "/api/v1/daily-health/plans/",
            {"plan_type": "exercise"},
            format="json",
        )

        self.assertEqual(diet_response.status_code, 201)
        self.assertEqual(exercise_response.status_code, 201)
        self.assertEqual(diet_response.data["model_name"], "gemini-3.1-flash-lite")
        self.assertEqual(LifestylePlan.objects.filter(owner=self.user).count(), 2)
        self.assertTrue(diet_response.data["safety_notes"])

    def test_daily_health_is_owner_scoped(self):
        other = User.objects.create_user(username="other-daily", password="test-password-123")
        JournalEntry.objects.create(
            owner=other,
            entry_date=date(2026, 7, 10),
            title="Other note",
        )
        SymptomLog.objects.create(
            owner=other,
            symptom="Headache",
            severity=SymptomLog.Severity.MILD,
            started_at=timezone.now(),
        )

        journal_response = self.client.get("/api/v1/daily-health/journal/")
        symptom_response = self.client.get("/api/v1/daily-health/symptoms/")

        self.assertEqual(journal_response.status_code, 200)
        self.assertEqual(symptom_response.status_code, 200)
        self.assertEqual(journal_response.data, [])
        self.assertEqual(symptom_response.data, [])
