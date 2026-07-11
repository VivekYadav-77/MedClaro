from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from documents.models import MedicalDocument
from health_profiles.models import Allergy, HealthProfile
from health_trends.models import TimelineEvent, TrendInsight
from medication_intelligence.models import (
    Medication,
    MedicationSchedule,
    MedicationWarning,
    PrescriptionAnalysis,
)
from report_analysis.models import ReportAnalysis

from .models import AssistantConversation, AssistantMessage


User = get_user_model()


class HealthHubApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="hub-user",
            email="hub@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        profile = HealthProfile.objects.create(
            user=self.user,
            age=38,
            gender=HealthProfile.Gender.FEMALE,
            privacy_consent=True,
        )
        Allergy.objects.create(profile=profile, name="Amoxicillin", severity="high")
        document = MedicalDocument.objects.create(
            owner=self.user,
            title="Annual blood report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_1/report.pdf",
            original_filename="report.pdf",
            content_type="application/pdf",
            size_bytes=10,
            source_date=date(2026, 7, 1),
        )
        self.report = ReportAnalysis.objects.create(
            owner=self.user,
            document=document,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
            health_score=72,
            health_status=ReportAnalysis.HealthStatus.NEEDS_ATTENTION,
            key_findings=["LDL needs follow-up"],
            model_name="gemini-3.1-flash-lite",
        )
        prescription_document = MedicalDocument.objects.create(
            owner=self.user,
            title="Clinic prescription",
            document_type=MedicalDocument.DocumentType.PRESCRIPTION,
            file="medical_documents/user_1/rx.pdf",
            original_filename="rx.pdf",
            content_type="application/pdf",
            size_bytes=10,
            source_date=date(2026, 7, 2),
        )
        prescription = PrescriptionAnalysis.objects.create(
            owner=self.user,
            document=prescription_document,
            status=PrescriptionAnalysis.ProcessingStatus.COMPLETED,
            model_name="gemini-3.1-flash-lite",
        )
        medication = Medication.objects.create(
            owner=self.user,
            analysis=prescription,
            brand_name="Amoxil",
            active_ingredient="Amoxicillin",
            strength="500 mg",
            purpose="Antibiotic",
        )
        MedicationSchedule.objects.create(
            medication=medication,
            dosage="1 capsule",
            frequency="Twice daily",
            timing=["morning", "night"],
        )
        MedicationWarning.objects.create(
            analysis=prescription,
            medication=medication,
            warning_type=MedicationWarning.WarningType.ALLERGY,
            severity=MedicationWarning.Severity.CRITICAL,
            title="Possible allergy match",
            message="Allergy may match this medicine.",
        )
        TrendInsight.objects.create(
            owner=self.user,
            biomarker_name="LDL Cholesterol",
            biomarker_code="LDL",
            unit="mg/dL",
            label=TrendInsight.TrendLabel.WORSENING,
            report_count=2,
            latest_value=160,
            risk_awareness=["This does not diagnose a condition."],
            doctor_prompts=["Should I repeat lipid testing?"],
            model_name="gemini-3.1-flash-lite",
        )
        TimelineEvent.objects.create(
            owner=self.user,
            event_type=TimelineEvent.EventType.REPORT,
            title="Annual blood report",
            summary="Report analyzed.",
            event_date=date(2026, 7, 1),
            source_type="report_analysis",
            source_id=self.report.id,
        )

    def test_dashboard_aggregates_health_context(self):
        response = self.client.get("/api/v1/health-hub/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["completion_percentage"], 33)
        self.assertEqual(response.data["health_score"], 72)
        self.assertEqual(len(response.data["alerts"]), 2)
        self.assertEqual(len(response.data["upcoming_reminders"]), 1)
        self.assertEqual(response.data["trend_alerts"][0]["biomarker"], "LDL Cholesterol")

    def test_memory_context_includes_profile_reports_medicines_and_warnings(self):
        response = self.client.get("/api/v1/health-hub/memory-context/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["exists"], True)
        self.assertEqual(len(response.data["recent_reports"]), 1)
        self.assertEqual(len(response.data["current_medicines"]), 1)
        self.assertEqual(len(response.data["prescription_warnings"]), 1)

    def test_assistant_turn_persists_user_and_assistant_messages(self):
        response = self.client.post(
            "/api/v1/health-hub/assistant/turns/",
            {"message": "Summarize my top health alerts"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["model_name"], "gemini-3.1-flash-lite")
        self.assertEqual(len(response.data["messages"]), 2)
        self.assertFalse(response.data["safety_review_required"])
        self.assertEqual(AssistantConversation.objects.filter(owner=self.user).count(), 1)
        self.assertEqual(AssistantMessage.objects.filter(conversation__owner=self.user).count(), 2)

    def test_sensitive_assistant_turn_sets_safety_review(self):
        response = self.client.post(
            "/api/v1/health-hub/assistant/turns/",
            {"message": "Can you diagnose my chest pain emergency?"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["safety_review_required"])
        assistant_message = response.data["messages"][-1]
        self.assertIn("emergency", assistant_message["safety_flags"])
        self.assertIn("qualified clinician", assistant_message["content"])

    def test_conversation_list_is_owner_scoped(self):
        other = User.objects.create_user(username="other-hub", password="test-password-123")
        AssistantConversation.objects.create(
            owner=other,
            model_name="gemini-3.1-flash-lite",
        )

        response = self.client.get("/api/v1/health-hub/assistant/conversations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
