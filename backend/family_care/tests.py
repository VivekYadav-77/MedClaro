from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from daily_health.models import SymptomLog
from documents.models import MedicalDocument
from health_profiles.models import Allergy, EmergencyContact, HealthProfile, KnownCondition
from medication_intelligence.models import Medication, PrescriptionAnalysis
from report_analysis.models import ReportAnalysis

from .models import (
    EmergencyProfileShare,
    FamilyAccessAudit,
    FamilyCircle,
    FamilyMembership,
    PermissionGrant,
)


User = get_user_model()


class FamilyCareApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="family-user",
            email="family@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        profile = HealthProfile.objects.create(
            user=self.user,
            age=42,
            gender=HealthProfile.Gender.FEMALE,
            blood_group=HealthProfile.BloodGroup.O_POSITIVE,
            location="Delhi",
            privacy_consent=True,
        )
        Allergy.objects.create(profile=profile, name="Penicillin", severity="high")
        KnownCondition.objects.create(profile=profile, name="Hypertension", status="managed")
        EmergencyContact.objects.create(
            profile=profile,
            name="Asha",
            relation="Sister",
            phone="+911234567890",
            is_primary=True,
        )
        report_document = MedicalDocument.objects.create(
            owner=self.user,
            title="Blood report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_1/report.pdf",
            original_filename="report.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )
        ReportAnalysis.objects.create(
            owner=self.user,
            document=report_document,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
            health_score=76,
            health_status=ReportAnalysis.HealthStatus.NEEDS_ATTENTION,
            key_findings=["LDL needs follow-up"],
            model_name="gemini-3.1-flash-lite",
        )
        prescription_document = MedicalDocument.objects.create(
            owner=self.user,
            title="Prescription",
            document_type=MedicalDocument.DocumentType.PRESCRIPTION,
            file="medical_documents/user_1/rx.pdf",
            original_filename="rx.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )
        prescription = PrescriptionAnalysis.objects.create(
            owner=self.user,
            document=prescription_document,
            status=PrescriptionAnalysis.ProcessingStatus.COMPLETED,
            model_name="gemini-3.1-flash-lite",
        )
        Medication.objects.create(
            owner=self.user,
            analysis=prescription,
            brand_name="Amlodipine",
            active_ingredient="Amlodipine",
            strength="5 mg",
        )
        SymptomLog.objects.create(
            owner=self.user,
            symptom="Headache",
            severity=SymptomLog.Severity.MODERATE,
            started_at=timezone.now(),
        )

    def test_create_circle_adds_owner_membership_permissions_and_audit(self):
        response = self.client.post(
            "/api/v1/family-care/circles/",
            {"name": "My Care Circle", "description": "Trusted people"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        circle = FamilyCircle.objects.get(owner=self.user)
        self.assertEqual(circle.memberships.count(), 1)
        owner_membership = circle.memberships.get(role=FamilyMembership.Role.OWNER)
        self.assertEqual(owner_membership.status, FamilyMembership.Status.ACTIVE)
        self.assertTrue(
            owner_membership.permission_grants.filter(
                permission=PermissionGrant.Permission.DOCTOR_SUMMARY,
                is_allowed=True,
            ).exists()
        )
        self.assertTrue(FamilyAccessAudit.objects.filter(circle=circle, action="circle_created").exists())

    def test_invite_and_revoke_member(self):
        circle = FamilyCircle.objects.create(owner=self.user, name="Care Circle")

        invite_response = self.client.post(
            f"/api/v1/family-care/circles/{circle.id}/invite/",
            {
                "display_name": "Dr Rao",
                "email": "doctor@example.com",
                "role": FamilyMembership.Role.DOCTOR,
            },
            format="json",
        )

        self.assertEqual(invite_response.status_code, 201)
        membership = FamilyMembership.objects.get(circle=circle, role=FamilyMembership.Role.DOCTOR)
        self.assertTrue(
            membership.permission_grants.filter(
                permission=PermissionGrant.Permission.REPORTS,
                is_allowed=True,
            ).exists()
        )

        revoke_response = self.client.post(
            f"/api/v1/family-care/circles/{circle.id}/members/{membership.id}/revoke/",
            format="json",
        )

        self.assertEqual(revoke_response.status_code, 204)
        membership.refresh_from_db()
        self.assertEqual(membership.status, FamilyMembership.Status.REVOKED)
        self.assertFalse(membership.permission_grants.filter(is_allowed=True).exists())

    def test_doctor_summary_contains_clinical_sections(self):
        response = self.client.post("/api/v1/family-care/doctor-summaries/", {}, format="json")

        self.assertEqual(response.status_code, 201)
        payload = response.data["summary_payload"]
        self.assertIn("patient_identity", payload)
        self.assertIn("known_conditions", payload)
        self.assertIn("allergies", payload)
        self.assertIn("current_medicines", payload)
        self.assertIn("recent_reports", payload)
        self.assertIn("symptoms", payload)
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")

    def test_emergency_share_public_access_and_revoke(self):
        create_response = self.client.post(
            "/api/v1/family-care/emergency-shares/",
            {"expires_in_hours": 24},
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        token = create_response.data["token"]
        public_response = self.client.get(
            f"/api/v1/family-care/emergency-shares/{token}/public/"
        )

        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(public_response.data["blood_group"], HealthProfile.BloodGroup.O_POSITIVE)
        self.assertIn("allergies", public_response.data)

        revoke_response = self.client.post(
            f"/api/v1/family-care/emergency-shares/{token}/revoke/",
            format="json",
        )
        self.assertEqual(revoke_response.status_code, 200)
        blocked_response = self.client.get(
            f"/api/v1/family-care/emergency-shares/{token}/public/"
        )
        self.assertEqual(blocked_response.status_code, 404)

    def test_expired_emergency_share_returns_410(self):
        share = EmergencyProfileShare.objects.create(
            owner=self.user,
            profile_payload={"blood_group": "O+"},
            expires_at=timezone.now() - timedelta(hours=1),
        )

        response = self.client.get(
            f"/api/v1/family-care/emergency-shares/{share.token}/public/"
        )

        self.assertEqual(response.status_code, 410)

    def test_family_circles_are_owner_scoped(self):
        other = User.objects.create_user(username="other-family", password="test-password-123")
        FamilyCircle.objects.create(owner=other, name="Other circle")

        response = self.client.get("/api/v1/family-care/circles/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
