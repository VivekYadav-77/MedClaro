from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TimelineEvent, TrendInsight
from .serializers import TimelineEventSerializer, TrendInsightSerializer
from .services import get_report_history, refresh_timeline_events, refresh_trend_insights


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_report_history(request.user))


class TimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh_timeline_events(request.user)
        events = TimelineEvent.objects.filter(owner=request.user)

        year = request.query_params.get("year")
        if year:
            events = events.filter(event_date__year=year)

        event_type = request.query_params.get("type")
        if event_type:
            events = events.filter(event_type=event_type)

        biomarker = request.query_params.get("biomarker")
        if biomarker:
            events = events.filter(tags__icontains=biomarker)

        return Response(TimelineEventSerializer(events, many=True).data)


class BiomarkerTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh_trend_insights(request.user)
        insights = TrendInsight.objects.filter(owner=request.user)

        biomarker = request.query_params.get("biomarker")
        if biomarker:
            insights = insights.filter(biomarker_name__icontains=biomarker)

        label = request.query_params.get("label")
        if label:
            insights = insights.filter(label=label)

        return Response(TrendInsightSerializer(insights, many=True).data)


class TrendInsightView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        insights = TrendInsight.objects.filter(owner=request.user)
        return Response(TrendInsightSerializer(insights, many=True).data)

    def post(self, request):
        insights = refresh_trend_insights(request.user)
        return Response(TrendInsightSerializer(insights, many=True).data)
