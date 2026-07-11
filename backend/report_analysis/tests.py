from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from documents.models import MedicalDocument

from .models import BiomarkerResult, ReportAnalysis


User = get_user_model()


class ReportAnalysisApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="analysis-user",
            email="analysis@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.document = MedicalDocument.objects.create(
            owner=self.user,
            title="Blood report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_1/blood-report.pdf",
            original_filename="blood-report.pdf",
            content_type="application/pdf",
            size_bytes=10,
            analysis_handoff={"ready_for": "report_analysis", "status": "pending"},
        )

    def test_create_analysis_generates_structured_biomarkers(self):
        response = self.client.post(
            "/api/v1/report-analyses/",
            {"document_id": self.document.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], ReportAnalysis.ProcessingStatus.COMPLETED)
        self.assertEqual(response.data["health_status"], ReportAnalysis.HealthStatus.NEEDS_ATTENTION)
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")
        self.assertEqual(len(response.data["biomarkers"]), 3)
        self.assertTrue(response.data["safety_review_required"])
        self.assertIn("doctor_mode", response.data["biomarkers"][0]["explanations"])

        analysis = ReportAnalysis.objects.get(owner=self.user)
        self.assertEqual(analysis.biomarkers.count(), 3)
        self.document.refresh_from_db()
        self.assertEqual(self.document.status, MedicalDocument.ProcessingStatus.ANALYZED)
        self.assertEqual(
            self.document.analysis_handoff["latest_report_analysis_id"],
            analysis.id,
        )

    def test_rejects_non_lab_report_document(self):
        prescription = MedicalDocument.objects.create(
            owner=self.user,
            title="Prescription",
            document_type=MedicalDocument.DocumentType.PRESCRIPTION,
            file="medical_documents/user_1/prescription.pdf",
            original_filename="prescription.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )

        response = self.client.post(
            "/api/v1/report-analyses/",
            {"document_id": prescription.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_analysis_list_is_owner_scoped(self):
        other = User.objects.create_user(username="other-analysis", password="test-password-123")
        other_document = MedicalDocument.objects.create(
            owner=other,
            title="Other report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_2/other.pdf",
            original_filename="other.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )
        other_analysis = ReportAnalysis.objects.create(
            owner=other,
            document=other_document,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
            model_name="gemini-3.1-flash-lite",
        )
        BiomarkerResult.objects.create(
            analysis=other_analysis,
            name="Hemoglobin",
            value="13",
            unit="g/dL",
        )

        response = self.client.get("/api/v1/report-analyses/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_status_endpoint_returns_analysis_summary(self):
        create_response = self.client.post(
            "/api/v1/report-analyses/",
            {"document_id": self.document.id},
            format="json",
        )
        analysis_id = create_response.data["id"]

        response = self.client.get(f"/api/v1/report-analyses/{analysis_id}/status/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], ReportAnalysis.ProcessingStatus.COMPLETED)
        self.assertIn("health_score", response.data)
