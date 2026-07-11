from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ai_services.gemini_config import GEMINI_MODULES
from documents.models import MedicalDocument
from family_care.models import FamilyCircle, FamilyMembership, PermissionGrant


User = get_user_model()


class ReleaseReadinessApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="release-user",
            email="release@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_release_readiness_plan_requires_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/v1/release-readiness/plan/")

        self.assertIn(response.status_code, [401, 403])

    def test_release_readiness_plan_includes_required_deliverables(self):
        response = self.client.get("/api/v1/release-readiness/plan/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("testing_strategy", response.data)
        self.assertIn("security_hardening", response.data)
        self.assertIn("observability_plan", response.data)
        self.assertIn("deployment_plan", response.data)
        self.assertIn("backup_restore_plan", response.data)
        self.assertIn("release_checklist", response.data)
        self.assertIn("medical", response.data["disclaimers"])

    def test_gemini_modules_have_separate_environment_boundaries(self):
        api_key_envs = [config.api_key_env for config in GEMINI_MODULES.values()]
        model_envs = [config.model_env for config in GEMINI_MODULES.values()]

        self.assertEqual(len(api_key_envs), len(set(api_key_envs)))
        self.assertEqual(len(model_envs), len(set(model_envs)))
        self.assertIn("safety_review", GEMINI_MODULES)

    def test_cross_user_document_detail_is_not_accessible(self):
        other = User.objects.create_user(username="other-release", password="test-password-123")
        document = MedicalDocument.objects.create(
            owner=other,
            title="Other report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_2/other.pdf",
            original_filename="other.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )

        response = self.client.get(f"/api/v1/documents/{document.id}/")

        self.assertEqual(response.status_code, 404)

    def test_family_permission_revocation_removes_allowed_grants(self):
        circle = FamilyCircle.objects.create(owner=self.user, name="Release Circle")
        membership = FamilyMembership.objects.create(
            circle=circle,
            display_name="Dr Review",
            role=FamilyMembership.Role.DOCTOR,
            status=FamilyMembership.Status.ACTIVE,
        )
        PermissionGrant.objects.create(
            membership=membership,
            permission=PermissionGrant.Permission.REPORTS,
            is_allowed=True,
        )

        response = self.client.post(
            f"/api/v1/family-care/circles/{circle.id}/members/{membership.id}/revoke/",
            format="json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(PermissionGrant.objects.filter(membership=membership, is_allowed=True).exists())


class ProductionSecuritySettingsTests(APITestCase):
    @override_settings(
        DEBUG=False,
        SECURE_SSL_REDIRECT=True,
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
        SECURE_HSTS_SECONDS=31536000,
    )
    def test_production_security_settings_can_be_enabled(self):
        from django.conf import settings

        self.assertFalse(settings.DEBUG)
        self.assertTrue(settings.SECURE_SSL_REDIRECT)
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_SECURE)
        self.assertGreaterEqual(settings.SECURE_HSTS_SECONDS, 31536000)
