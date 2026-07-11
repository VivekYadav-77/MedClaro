from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import SecondOpinionRequest, VaccinationRecord


User = get_user_model()


class FutureModulesApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="future-user",
            email="future@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_strategy_includes_roadmap_and_extension_rules(self):
        response = self.client.get("/api/v1/future-modules/strategy/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("roadmap", response.data)
        self.assertIn("data_extension_strategy", response.data)
        self.assertIn("advanced_ai_safety", response.data)
        self.assertGreaterEqual(len(response.data["roadmap"]), 6)

    def test_vaccination_record_adds_reminder_logic(self):
        response = self.client.post(
            "/api/v1/future-modules/vaccinations/",
            {
                "vaccine_name": "Influenza",
                "dose_label": "Annual",
                "next_due_on": "2026-08-01",
                "provider": "Family clinic",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["reminder_rules"])
        self.assertEqual(VaccinationRecord.objects.filter(owner=self.user).count(), 1)

    def test_second_opinion_request_uses_guardrails(self):
        response = self.client.post(
            "/api/v1/future-modules/second-opinions/",
            {
                "concern": "I want to understand if my report and prescription need another doctor review.",
                "related_document_ids": [1, 2],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], SecondOpinionRequest.Status.READY_FOR_DOCTOR)
        self.assertIn("discussion_points", response.data)
        self.assertTrue(response.data["safety_language"])
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")

    def test_future_records_are_owner_scoped(self):
        other = User.objects.create_user(username="other-future", password="test-password-123")
        VaccinationRecord.objects.create(owner=other, vaccine_name="Other vaccine")

        response = self.client.get("/api/v1/future-modules/vaccinations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_integration_boundaries_document_partner_consent(self):
        response = self.client.get("/api/v1/future-modules/integration-boundaries/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 4)
        self.assertTrue(all(item["consent_required"] for item in response.data))
