from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import MedicalDocument


User = get_user_model()


@override_settings(MEDIA_ROOT="test_media")
class MedicalDocumentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="doc-user",
            email="doc@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_upload_document_creates_owner_scoped_record(self):
        upload = SimpleUploadedFile(
            "blood-report.pdf",
            b"%PDF-1.4 test",
            content_type="application/pdf",
        )

        response = self.client.post(
            "/api/v1/documents/",
            {
                "title": "Blood report",
                "document_type": "lab_report",
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        document = MedicalDocument.objects.get(owner=self.user)
        self.assertEqual(document.status, "uploaded")
        self.assertEqual(document.analysis_handoff["ready_for"], "report_analysis")

    def test_rejects_unsupported_file_extension(self):
        upload = SimpleUploadedFile(
            "notes.exe",
            b"bad",
            content_type="application/octet-stream",
        )

        response = self.client.post(
            "/api/v1/documents/",
            {
                "title": "Bad file",
                "document_type": "other",
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    def test_document_list_is_owner_scoped(self):
        other = User.objects.create_user(username="other-doc", password="test-password-123")
        MedicalDocument.objects.create(
            owner=other,
            title="Other report",
            document_type="lab_report",
            file="medical_documents/user_2/other.pdf",
            original_filename="other.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )

        response = self.client.get("/api/v1/documents/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_delete_soft_deletes_document(self):
        document = MedicalDocument.objects.create(
            owner=self.user,
            title="Prescription",
            document_type="prescription",
            file="medical_documents/user_1/prescription.pdf",
            original_filename="prescription.pdf",
            content_type="application/pdf",
            size_bytes=10,
        )

        response = self.client.delete(f"/api/v1/documents/{document.id}/")

        self.assertEqual(response.status_code, 204)
        document.refresh_from_db()
        self.assertTrue(document.is_deleted)
