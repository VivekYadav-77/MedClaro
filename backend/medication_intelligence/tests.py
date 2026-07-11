from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from documents.models import MedicalDocument
from health_profiles.models import Allergy, HealthProfile
from health_trends.models import TimelineEvent

from .models import Medication, MedicationWarning, PrescriptionAnalysis


User = get_user_model()


class PrescriptionAnalysisApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="rx-user",
            email="rx@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.document = MedicalDocument.objects.create(
            owner=self.user,
            title="Clinic prescription",
            document_type=MedicalDocument.DocumentType.PRESCRIPTION,
            file="medical_documents/user_1/prescription.pdf",
            original_filename="prescription.pdf",
            content_type="application/pdf",
            size_bytes=10,
            source_date=date(2026, 7, 1),
            analysis_handoff={"ready_for": "prescription_analysis", "status": "pending"},
        )

    def test_create_prescription_analysis_extracts_medications_and_timeline(self):
        response = self.client.post(
            "/api/v1/prescriptions/analyses/",
            {"document_id": self.document.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], PrescriptionAnalysis.ProcessingStatus.COMPLETED)
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")
        self.assertEqual(len(response.data["medications"]), 2)
        self.assertTrue(response.data["medications"][0]["schedules"])
        self.assertGreaterEqual(len(response.data["medication_warnings"]), 1)

        analysis = PrescriptionAnalysis.objects.get(owner=self.user)
        self.assertEqual(analysis.medications.count(), 2)
        self.assertTrue(
            TimelineEvent.objects.filter(
                owner=self.user,
                event_type=TimelineEvent.EventType.PRESCRIPTION,
                source_id=analysis.id,
            ).exists()
        )
        self.document.refresh_from_db()
        self.assertEqual(self.document.status, MedicalDocument.ProcessingStatus.ANALYZED)
        self.assertEqual(
            self.document.analysis_handoff["latest_prescription_analysis_id"],
            analysis.id,
        )

    def test_rejects_non_prescription_document(self):
        report = MedicalDocument.objects.create(
            owner=self.user,
            title="Blood report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_1/report.pdf",
            original_filename="report.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )

        response = self.client.post(
            "/api/v1/prescriptions/analyses/",
            {"document_id": report.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_allergy_match_creates_critical_warning(self):
        profile = HealthProfile.objects.create(user=self.user, privacy_consent=True)
        Allergy.objects.create(
            profile=profile,
            name="Amoxicillin",
            reaction="Rash",
            severity="high",
        )

        response = self.client.post(
            "/api/v1/prescriptions/analyses/",
            {"document_id": self.document.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["safety_review_required"])
        self.assertTrue(
            MedicationWarning.objects.filter(
                analysis__owner=self.user,
                warning_type=MedicationWarning.WarningType.ALLERGY,
                severity=MedicationWarning.Severity.CRITICAL,
            ).exists()
        )

    def test_medication_list_is_owner_scoped(self):
        other = User.objects.create_user(username="other-rx", password="test-password-123")
        other_document = MedicalDocument.objects.create(
            owner=other,
            title="Other prescription",
            document_type=MedicalDocument.DocumentType.PRESCRIPTION,
            file="medical_documents/user_2/prescription.pdf",
            original_filename="prescription.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )
        other_analysis = PrescriptionAnalysis.objects.create(
            owner=other,
            document=other_document,
            status=PrescriptionAnalysis.ProcessingStatus.COMPLETED,
            model_name="gemini-3.1-flash-lite",
        )
        Medication.objects.create(
            owner=other,
            analysis=other_analysis,
            brand_name="Other med",
            active_ingredient="Other",
        )

        response = self.client.get("/api/v1/prescriptions/medications/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_status_endpoint_returns_summary(self):
        create_response = self.client.post(
            "/api/v1/prescriptions/analyses/",
            {"document_id": self.document.id},
            format="json",
        )
        analysis_id = create_response.data["id"]

        response = self.client.get(f"/api/v1/prescriptions/analyses/{analysis_id}/status/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], PrescriptionAnalysis.ProcessingStatus.COMPLETED)
        self.assertEqual(response.data["medication_count"], 2)
