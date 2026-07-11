from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import HealthProfile


User = get_user_model()


class HealthProfileApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile-user",
            email="profile@example.com",
            password="test-password-123",
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_create_profile_with_nested_health_context(self):
        response = self.client.post(
            "/api/v1/profiles/",
            {
                "age": 32,
                "gender": "female",
                "height_cm": "165.00",
                "weight_kg": "62.50",
                "blood_group": "O+",
                "occupation": "Teacher",
                "smoking": "never",
                "alcohol": "occasional",
                "exercise": "Walks 30 minutes daily",
                "sleep_hours": "7.50",
                "pregnancy_status": "not pregnant",
                "preferred_language": "English",
                "food_preference": "vegetarian",
                "location": "Delhi",
                "privacy_consent": True,
                "allergies": [{"name": "Penicillin", "severity": "high"}],
                "known_conditions": [{"name": "Hypothyroidism", "status": "managed"}],
                "family_history": [
                    {"relation": "Father", "condition": "Type 2 diabetes"}
                ],
                "emergency_contacts": [
                    {
                        "name": "Asha",
                        "relation": "Sister",
                        "phone": "+919999999999",
                        "is_primary": True,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        profile = HealthProfile.objects.get(user=self.user)
        self.assertEqual(profile.allergies.count(), 1)
        self.assertEqual(profile.known_conditions.count(), 1)
        self.assertGreater(response.data["completion_percentage"], 80)

    def test_profile_is_owner_scoped(self):
        other = User.objects.create_user(username="other", password="test-password-123")
        HealthProfile.objects.create(user=other, age=40)

        response = self.client.get("/api/v1/profiles/me/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data)
