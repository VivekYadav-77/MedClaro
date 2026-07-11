from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from health_profiles.models import HealthProfile

from .models import AccessibilityPreference, LocalizedContentArtifact, VoiceSummaryArtifact


User = get_user_model()


class AccessibilityApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="access-user",
            email="access@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        HealthProfile.objects.create(
            user=self.user,
            preferred_language="Hindi",
            privacy_consent=True,
        )

    def test_preferences_default_from_profile_and_update_senior_mode(self):
        response = self.client.get("/api/v1/accessibility/preferences/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["preferred_language"], AccessibilityPreference.Language.HINDI)

        patch_response = self.client.patch(
            "/api/v1/accessibility/preferences/",
            {
                "senior_mode": True,
                "simplified_dashboard": True,
                "large_text": "extra_large",
                "voice_summaries": True,
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, 200)
        self.assertTrue(patch_response.data["senior_mode"])
        self.assertEqual(patch_response.data["large_text"], "extra_large")

    def test_accessibility_plan_includes_language_voice_and_fallback(self):
        response = self.client.get("/api/v1/accessibility/plan/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("supported_languages", response.data)
        self.assertEqual(response.data["translation_workflow"]["model"], "gemini-3.1-flash-lite")
        self.assertEqual(response.data["fallback_language"], AccessibilityPreference.Language.ENGLISH)
        self.assertIn("read_aloud_targets", response.data["voice_workflow"])

    def test_create_localized_content_artifact(self):
        response = self.client.post(
            "/api/v1/accessibility/localized-content/",
            {
                "source_type": "assistant",
                "language": "hi",
                "original_text": "Take this medicine after food.",
                "literacy_level": "simple",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")
        self.assertIn("Hindi draft", response.data["localized_text"])
        self.assertTrue(response.data["quality_checks"])
        self.assertEqual(LocalizedContentArtifact.objects.filter(owner=self.user).count(), 1)

    def test_create_voice_summary_artifact(self):
        response = self.client.post(
            "/api/v1/accessibility/voice-summaries/",
            {
                "voice_type": "report_read_aloud",
                "language": "hi",
                "script_text": "Your latest report has two items to discuss.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["provider_status"], "planned")
        self.assertTrue(response.data["provider_metadata"]["read_aloud_ready"])
        self.assertEqual(VoiceSummaryArtifact.objects.filter(owner=self.user).count(), 1)

    def test_artifacts_are_owner_scoped(self):
        other = User.objects.create_user(username="other-access", password="test-password-123")
        LocalizedContentArtifact.objects.create(
            owner=other,
            source_type=LocalizedContentArtifact.SourceType.ASSISTANT,
            language=AccessibilityPreference.Language.ENGLISH,
            original_text="Other",
            localized_text="Other",
            model_name="gemini-3.1-flash-lite",
        )

        response = self.client.get("/api/v1/accessibility/localized-content/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
