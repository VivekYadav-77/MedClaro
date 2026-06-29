from django.test import TestCase
from rest_framework.test import APIClient

from projecthealth_backend.security import create_access_token
from reports.models import DischargePlan, GlobalChatMessage, RemissionPathway, Report, ScreeningSchedule
from reports.services import EncryptionService
from users.models import User


class ReportsFeatureFoundationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email_hash="test-user-hash",
            name="Test User",
            password="password123",
            email_encrypted={},
            is_verified=True,
        )
        self.client = APIClient()
        token = create_access_token(str(self.user.id), "test@example.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.encryptor = EncryptionService()

    def create_report(self, marker_name="HbA1c", value=7.2, flag="high", report_type="blood_test"):
        return Report.objects.create(
            user=self.user,
            report_type=report_type,
            lab_name="Test Lab",
            file_ref="reports/test.pdf",
            structured_data_encrypted=self.encryptor.encrypt_json(
                {
                    "structuredData": [
                        {
                            "testName": marker_name,
                            "value": value,
                            "unit": "%",
                            "normalizedValue": value,
                            "normalizedUnit": "%",
                            "referenceRangeLow": 4,
                            "referenceRangeHigh": 5.6,
                            "flag": flag,
                        }
                    ]
                }
            ),
            ai_explanation={"holisticSummary": "Saved test report.", "disclaimer": "Review with a clinician."},
            analysis_status="completed",
            analysis_metadata={"confidence": "medium", "fallbackUsed": False},
        )

    def test_report_list_supports_optional_abnormal_filter(self):
        self.create_report()
        response = self.client.get("/api/reports?abnormal=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["analysisStatus"], "completed")

    def test_trends_include_variance_and_guideline_notes(self):
        self.create_report(value=5.0, flag="normal")
        self.create_report(value=11.0, flag="high")
        response = self.client.get("/api/reports/trends")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("varianceFlags", payload)
        self.assertIn("guidelineNotes", payload)

    def test_global_chat_persists_messages(self):
        self.create_report()
        response = self.client.post("/api/reports/chat", {"message": "What is my HbA1c?"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get("sessionId"))
        self.assertEqual(GlobalChatMessage.objects.count(), 2)

    def test_screening_preview_persists_schedules(self):
        response = self.client.get("/api/reports/screening-preview")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(ScreeningSchedule.objects.filter(user=self.user).count(), 3)
        self.assertIn("schedules", response.json())

    def test_discharge_upload_persists_plan_and_tasks(self):
        response = self.client.post("/api/reports/discharge", {"notes": "wound dressing and physio"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json().get("planId"))
        plan = DischargePlan.objects.get(user=self.user)
        self.assertGreaterEqual(plan.tasks.count(), 4)

    def test_pathways_are_persisted_and_loggable(self):
        self.create_report(marker_name="HbA1c", value=7.2, flag="high")
        response = self.client.get("/api/pathways")
        self.assertEqual(response.status_code, 200)
        pathway_id = response.json()["pathways"][0]["id"]
        self.assertEqual(RemissionPathway.objects.filter(user=self.user).count(), 1)
        log_response = self.client.post("/api/pathways", {"pathwayId": pathway_id, "note": "Walked after lunch."}, format="json")
        self.assertEqual(log_response.status_code, 200)
        self.assertGreater(log_response.json()["progressPercent"], 8)
