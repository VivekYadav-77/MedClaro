from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from documents.models import MedicalDocument
from report_analysis.models import BiomarkerResult, ReportAnalysis

from .models import TimelineEvent, TrendInsight


User = get_user_model()


class HealthTrendApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="trend-user",
            email="trend@example.com",
            password="test-password-123",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self._create_analysis("January report", date(2026, 1, 10), "160")
        self._create_analysis("April report", date(2026, 4, 10), "140")

    def test_report_history_returns_owner_scoped_analysis_rows(self):
        response = self.client.get("/api/v1/health-trends/reports/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["biomarker_count"], 1)

    def test_timeline_refreshes_report_events(self):
        response = self.client.get("/api/v1/health-trends/timeline/?year=2026")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(TimelineEvent.objects.filter(owner=self.user).count(), 2)
        self.assertEqual(response.data[0]["event_type"], TimelineEvent.EventType.REPORT)

    def test_trend_refresh_generates_graph_points_and_label(self):
        response = self.client.post("/api/v1/health-trends/insights/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        insight = response.data[0]
        self.assertEqual(insight["biomarker_name"], "LDL Cholesterol")
        self.assertEqual(insight["label"], TrendInsight.TrendLabel.IMPROVING)
        self.assertEqual(insight["report_count"], 2)
        self.assertEqual(len(insight["graph_points"]), 2)
        self.assertIn("does not diagnose", " ".join(insight["risk_awareness"]))

    def test_trends_are_owner_scoped(self):
        other = User.objects.create_user(username="other-trend", password="test-password-123")
        other_document = MedicalDocument.objects.create(
            owner=other,
            title="Other report",
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file="medical_documents/user_2/other.pdf",
            original_filename="other.pdf",
            content_type="application/pdf",
            size_bytes=10,
            source_date=date(2026, 3, 1),
        )
        ReportAnalysis.objects.create(
            owner=other,
            document=other_document,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
            health_score=80,
            health_status=ReportAnalysis.HealthStatus.GOOD,
            model_name="gemini-3.1-flash-lite",
            completed_at="2026-03-01T00:00:00Z",
        )

        response = self.client.post("/api/v1/health-trends/insights/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def _create_analysis(self, title: str, source_date: date, ldl_value: str):
        document = MedicalDocument.objects.create(
            owner=self.user,
            title=title,
            document_type=MedicalDocument.DocumentType.LAB_REPORT,
            file=f"medical_documents/user_1/{title}.pdf",
            original_filename=f"{title}.pdf",
            content_type="application/pdf",
            size_bytes=10,
            source_date=source_date,
        )
        analysis = ReportAnalysis.objects.create(
            owner=self.user,
            document=document,
            status=ReportAnalysis.ProcessingStatus.COMPLETED,
            health_score=78,
            health_status=ReportAnalysis.HealthStatus.NEEDS_ATTENTION,
            model_name="gemini-3.1-flash-lite",
            completed_at=f"{source_date.isoformat()}T00:00:00Z",
        )
        BiomarkerResult.objects.create(
            analysis=analysis,
            name="LDL Cholesterol",
            code="LDL",
            value=ldl_value,
            unit="mg/dL",
            normal_range="<100 mg/dL",
            status=BiomarkerResult.MarkerStatus.HIGH,
            severity=2,
        )
        return analysis
