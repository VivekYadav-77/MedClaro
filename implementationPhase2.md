# MedClaro — Phase 2 Implementation Plan (Features 6–10)

> **Prerequisite:** Phase 1 must be merged and migrated before starting Phase 2.
> All features are zero external cost — uses Gemini free tier + native browser APIs only.

---

## FEATURE 6 — Lifestyle-to-Report Correlation Engine

### Concept
Users log plain-text lifestyle tags on their profile (e.g., "Started daily 30-min walks", "Quit smoking"). When the next report uploads, Gemini compares the delta between old and new report and gives credit to the lifestyle changes. Makes the data feel rewarding.

### Backend Changes

#### MODIFY `backend/users/models.py`
Add a `LifestyleLog` model:
```python
class LifestyleLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="lifestyle_logs", on_delete=models.CASCADE)
    note = models.CharField(max_length=200)  # e.g. "Started walking 30 min daily"
    logged_at = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-logged_at"]
```

#### NEW `backend/users/views.py` — `LifestyleLogView`
```python
class LifestyleLogView(APIView):
    def get(self, request):
        logs = request.user.lifestyle_logs.filter(active=True)
        return Response([{"id": str(l.id), "note": l.note, "loggedAt": l.logged_at} for l in logs])

    def post(self, request):
        note = request.data.get("note", "").strip()
        if not note or len(note) > 200:
            return Response({"error": "Note must be 1-200 characters"}, status=400)
        log = LifestyleLog.objects.create(user=request.user, note=note)
        return Response({"id": str(log.id), "note": log.note, "loggedAt": log.logged_at})

    def delete(self, request, log_id):
        LifestyleLog.objects.filter(id=log_id, user=request.user).update(active=False)
        return Response({"message": "Log removed"})
```

#### MODIFY `backend/users/urls.py`
```python
path("lifestyle-logs", LifestyleLogView.as_view()),
path("lifestyle-logs/<uuid:log_id>", LifestyleLogView.as_view()),
```

#### MODIFY `backend/reports/services.py` — `GeminiService`
Add method:
```python
def correlate_lifestyle(self, lifestyle_notes: list[str], old_report: dict | None, new_report: dict, language: str) -> dict:
    """
    Returns JSON: {correlations: [{note, relatedMarkers:[str], impact:"positive"|"neutral"|"negative", message:str}],
                   overallMessage: str}
    """
    prompt = f"""
    The user has made these lifestyle changes since their last blood report: {lifestyle_notes}
    Compare the old report (may be null) and new report structured data.
    For each lifestyle note, identify which blood markers may have been affected and whether the change was positive.
    Return JSON with keys: correlations (array with note, relatedMarkers, impact, message) and overallMessage.
    Respond in language code {language}. Use encouraging, plain language. Never diagnose.
    Old report data: {json.dumps(old_report, default=str) if old_report else "None (first report)"}
    New report data: {json.dumps(new_report["structuredData"], default=str)}
    """
    raw = self.generate_json(prompt=prompt, report_text="lifestyle", report_type="correlation")
    return json.loads(raw)
```

#### MODIFY `backend/reports/services.py` — `ReportService.create_report()`
After saving the report, add:
```python
# Lifestyle correlation (async-safe: wrapped in try/except, non-blocking to report save)
lifestyle_notes = list(current_user.lifestyle_logs.filter(active=True).values_list("note", flat=True))
if lifestyle_notes:
    previous = Report.objects.filter(user=current_user, report_type=parsed["report_type"]).exclude(id=report.id).order_by("-upload_date").first()
    previous_hydrated = self.hydrator.hydrate(previous) if previous else None
    try:
        correlation = self.ai.correlate_lifestyle(
            lifestyle_notes=list(lifestyle_notes),
            old_report=previous_hydrated,
            new_report=self.hydrator.hydrate(report),
            language=current_user.preferred_language,
        )
        # Store in ai_explanation for the frontend to pick up
        report.ai_explanation["lifestyleCorrelation"] = correlation
        report.save(update_fields=["ai_explanation"])
    except Exception:
        pass  # Non-critical, never block report creation
```

### Frontend Changes

#### MODIFY `frontend/lib/types.ts`
Add to `ReportExplanation`:
```ts
lifestyleCorrelation?: {
  correlations: { note: string; relatedMarkers: string[]; impact: "positive"|"neutral"|"negative"; message: string }[];
  overallMessage: string;
};
```

#### NEW `frontend/components/reports/lifestyle-correlation-card.tsx`
- Props: `correlation: ReportExplanation["lifestyleCorrelation"]`
- Renders `overallMessage` in a highlighted green banner.
- Lists each correlation: note text, impact icon (✅ / ➖ / 🔻), message.
- Import and render in `report-detail-view.tsx` after the AI Explanation section.

#### NEW `frontend/app/(app)/settings/lifestyle-logs-section.tsx`
Client component for the Settings page:
- Shows existing lifestyle log entries as removable chips/tags.
- Text input + "Add" button to create new entries.
- Calls `GET /api/lifestyle-logs` on mount.
- Calls `POST /api/lifestyle-logs` on add.
- Calls `DELETE /api/lifestyle-logs/{id}` on remove.

#### MODIFY `frontend/app/(app)/settings/page.tsx`
Import `LifestyleLogsSection` and add it as a new card below the Profile card with heading "Lifestyle Tracker".

---

## FEATURE 7 — Hyper-Local, Culturally Aware Diet Advice

### Concept
When a report has out-of-range markers, the AI generates diet adjustments using local foods based on the user's preferred language (which maps to a regional cuisine).

### Language-to-Region Mapping (Used in Prompt)
```
en → Generic Indian / Universal
hi → North Indian (UP, Rajasthan, Delhi belt)
ta → Tamil Nadu / South Indian
bn → Bengali / East Indian
te → Andhra / Telangana
mr → Maharashtra / Konkan
```

### Backend Changes

#### MODIFY `backend/reports/services.py` — `GeminiService`
Add method:
```python
LANGUAGE_REGION_MAP = {
    "en": "general Indian", "hi": "North Indian (Hindi belt)",
    "ta": "Tamil Nadu South Indian", "bn": "Bengali East Indian",
    "te": "Andhra Telangana", "mr": "Maharashtra Konkan"
}

def generate_diet_advice(self, abnormal_markers: list[dict], language: str) -> dict:
    """
    Returns JSON: {advice: [{marker, currentStatus, dietSuggestions:[str], foodsToAvoid:[str]}]}
    """
    region = self.LANGUAGE_REGION_MAP.get(language, "general Indian")
    prompt = f"""
    For a patient from the {region} region, provide hyper-local diet advice for these out-of-range blood markers.
    Suggest locally available, culturally familiar foods (e.g., specific dals, millets, vegetables, spices).
    Return JSON with key 'advice': array of objects with marker, currentStatus, dietSuggestions (list of 3), foodsToAvoid (list of 2).
    Respond in language code {language}. Never use generic Western foods like salmon or quinoa unless the region warrants it.
    Markers: {json.dumps(abnormal_markers, default=str)}
    """
    raw = self.generate_json(prompt=prompt, report_text="diet", report_type="diet_advice")
    return json.loads(raw)
```

#### MODIFY `backend/reports/views.py`
Add new view:
```python
class ReportDietAdviceView(APIView):
    def get(self, request, report_id):
        report = Report.objects.filter(id=report_id, user=request.user).first()
        if not report:
            return Response({"error": "Report not found"}, status=404)
        hydrated = ReportHydrator().hydrate(report)
        abnormal = [p for p in hydrated["structuredData"] if p.get("flag") != "normal"]
        if not abnormal:
            return Response({"advice": [], "message": "All markers are within normal range."})
        try:
            result = GeminiService().generate_diet_advice(abnormal, request.user.preferred_language)
        except Exception:
            result = {"advice": [], "message": "Diet advice temporarily unavailable."}
        return Response(result)
```

#### MODIFY `backend/reports/urls.py`
Add: `path("reports/<uuid:report_id>/diet-advice", ReportDietAdviceView.as_view())`

### Frontend Changes

#### NEW `frontend/components/reports/diet-advice-panel.tsx`
Client component:
- Props: `reportId: string`
- State: `advice`, `loading`, `fetched`
- On first render (or button click): fetch `GET /api/reports/{reportId}/diet-advice`.
- Lazy-loaded with a "Get diet suggestions" button to avoid unnecessary Gemini calls.
- Renders each marker's advice as a card with a green food list and red avoid list.

#### MODIFY `frontend/components/dashboard/report-detail-view.tsx`
Add `<DietAdvicePanel reportId={displayReport._id} />` after the Prescription Details section.

---

## FEATURE 8 — Treatment Effectiveness Pre-Screener

### Concept
AI compares prescription history timeline with blood report timeline to detect cases where medications are not producing expected improvements, and flags them with a clear message.

### Backend Changes

#### MODIFY `backend/reports/views.py`
Add new view:
```python
class TreatmentEffectivenessView(APIView):
    def get(self, request):
        hydrator = ReportHydrator()
        all_reports = [hydrator.hydrate(r) for r in
                       Report.objects.filter(user=request.user).order_by("upload_date").prefetch_related("chat_messages")]
        prescriptions = [r for r in all_reports if r["reportType"] == "prescription"]
        blood_reports = [r for r in all_reports if r["reportType"] != "prescription"]
        if len(prescriptions) == 0 or len(blood_reports) < 2:
            return Response({"findings": [], "message": "Need at least one prescription and two blood reports to analyze treatment effectiveness."})
        try:
            result = GeminiService().analyze_treatment_effectiveness(
                prescriptions=prescriptions,
                blood_reports=blood_reports,
                language=request.user.preferred_language,
            )
        except Exception:
            result = {"findings": [], "message": "Analysis temporarily unavailable."}
        return Response(result)
```

#### MODIFY `backend/reports/services.py` — `GeminiService`
Add method:
```python
def analyze_treatment_effectiveness(self, prescriptions: list[dict], blood_reports: list[dict], language: str) -> dict:
    """
    Returns JSON: {findings: [{medicationName, targetMarker, startDate, trend:"improving"|"not_improving"|"worsening",
                   recommendation: str, urgency:"low"|"medium"|"high"}], overallAssessment: str}
    """
    prompt = f"""
    Analyze whether the prescribed medications appear to be producing expected results in the blood tests.
    For each active medication, find the marker it likely targets and check if that marker improved after the prescription date.
    Return JSON: findings array with medicationName, targetMarker, startDate, trend, recommendation, urgency.
    Also return overallAssessment (1 paragraph summary).
    Respond in language code {language}. Never tell user to stop medications.
    Prescription history: {json.dumps([{"date": p.get("reportDate"), "medications": p.get("medications", [])} for p in prescriptions], default=str)}
    Blood report history: {json.dumps([{"date": r.get("reportDate"), "markers": r["structuredData"]} for r in blood_reports], default=str)}
    """
    raw = self.generate_json(prompt=prompt, report_text="treatment", report_type="treatment_analysis")
    return json.loads(raw)
```

#### MODIFY `backend/reports/urls.py`
Add: `path("reports/treatment-effectiveness", TreatmentEffectivenessView.as_view())`

### Frontend Changes

#### NEW `frontend/app/(app)/trends/treatment-tab.tsx`
Client component rendered as a tab/section on the Trends page:
- On mount: fetch `GET /api/reports/treatment-effectiveness`.
- Show loading skeleton while fetching.
- Renders `overallAssessment` in a highlighted panel.
- Lists each finding as a card: medication name, target marker, trend badge (green=improving, amber=not_improving, red=worsening), recommendation text.
- Urgency badge controls card border color.

#### MODIFY `frontend/app/(app)/trends/page.tsx`
Add the `TreatmentTab` as a new section below trajectories with heading "Treatment Effectiveness".

---

## FEATURE 9 — Offline Emergency Audio Broadcast Card

### Concept
A critical-info card accessible even offline. Shows blood type, conditions, active medications, and uses the browser's Speech API to broadcast this aloud. Generates a QR code (using a free JS library — no API needed) that encodes the same info.

### Frontend Changes Only (No Backend Needed)

#### MODIFY `frontend/package.json`
Add dependency: `"qrcode": "^1.5.3"` and `"@types/qrcode": "^1.5.5"`. Run `npm install`.

#### NEW `frontend/components/dashboard/emergency-card.tsx`
Client component:
```
Props: user: UserProfile, latestReport: Report | null

State: broadcasting: boolean, qrDataUrl: string | null

On mount:
  - Build emergencyText string:
    "EMERGENCY MEDICAL INFO: Name: {user.name}. Blood type: unknown (from report if found).
     Active medications: {medications.join(", ")}.
     Recent abnormal markers: {abnormalMarkers.join(", ")}.
     Contact family via MedClaro."
  - Generate QR code via qrcode.toDataURL(emergencyText) → store in qrDataUrl.

UI:
  - Card with red border, red header "🚨 Emergency Card".
  - Shows name, list of active medications (from latest prescription report), abnormal markers.
  - QR code image rendered from qrDataUrl.
  - Button "📢 Broadcast Aloud": toggles broadcasting state.
    When broadcasting=true:
      Create SpeechSynthesisUtterance with emergencyText.
      Set utterance.rate = 0.85, utterance.lang = "en-US" (always English for emergency).
      utterance.onend = () => setBroadcasting(false).
      window.speechSynthesis.speak(utterance).
    When broadcasting=true: show "🔴 Broadcasting..." with pulse animation.
    Button to stop: window.speechSynthesis.cancel(); setBroadcasting(false).
  - Disclaimer: "This card works offline once the page has loaded."
```

#### MODIFY `frontend/components/dashboard/dashboard-client.tsx`
- Import `EmergencyCard`.
- In the right aside column, below the Quick Actions card, add `<EmergencyCard user={user} latestReport={reports[0] ?? null} />`.
- Wrap in a `<details>` element with `<summary>Emergency Card</summary>` so it's collapsed by default and doesn't alarm users unnecessarily.

---

## FEATURE 10 — Family Care Streaks & Celebrations

### Concept
When a report is uploaded and a previously out-of-range marker enters the normal range for the first time in 2+ reports, the system creates a "milestone" feed entry. Circle members receive a special notification and can react with "Celebrate".

### Backend Changes

#### MODIFY `backend/reports/services.py` — `ReportService.create_report()`
After saving the report, add milestone detection:
```python
# Milestone detection: check if any previously abnormal marker is now normal
if previous_hydrated:  # reuse previous_hydrated from lifestyle correlation block
    previous_abnormal = {p["testName"] for p in previous_hydrated.get("structuredData", []) if p.get("flag") != "normal"}
    now_normal = [p for p in parsed["structured_data"] if p.get("flag") == "normal" and p["testName"] in previous_abnormal]
    if now_normal:
        milestone_markers = [p["testName"] for p in now_normal]
        for membership in CircleMember.objects.filter(user=current_user).select_related("circle"):
            entry = ActivityFeedEntry.objects.create(
                circle=membership.circle,
                actor=current_user,
                event_type="marker_improved",
                payload={
                    "uploaderName": current_user.name,
                    "improvedMarkers": milestone_markers,
                    "reportType": parsed["report_type"],
                }
            )
            other_members = CircleMember.objects.filter(circle=membership.circle).exclude(user=current_user)
            Notification.objects.bulk_create([
                Notification(user=m.user, feed_entry=entry) for m in other_members
            ])
```

#### MODIFY `backend/circles/models.py`
Add `FeedReaction` model:
```python
class FeedReaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feed_entry = models.ForeignKey(ActivityFeedEntry, related_name="reactions", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10, default="🎉")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("feed_entry", "user")
```

#### MODIFY `backend/circles/views.py`
Add `FeedReactionView`:
```python
class FeedReactionView(APIView):
    def post(self, request, entry_id):
        entry = ActivityFeedEntry.objects.filter(id=entry_id).first()
        if not entry:
            return Response({"error": "Entry not found"}, status=404)
        # Verify user is a member of this circle
        if not CircleMember.objects.filter(circle=entry.circle, user=request.user).exists():
            return Response({"error": "Forbidden"}, status=403)
        reaction, created = FeedReaction.objects.get_or_create(feed_entry=entry, user=request.user, defaults={"emoji": "🎉"})
        if not created:
            reaction.delete()  # Toggle off if already reacted
            return Response({"reacted": False})
        return Response({"reacted": True})
```

#### MODIFY `backend/circles/urls.py`
Add: `path("circles/feed/<uuid:entry_id>/react", FeedReactionView.as_view())`

#### MODIFY `backend/circles/serializers.py` — `ActivityFeedSerializer`
Add `reactionCount` and `userHasReacted` fields (computed from `reactions` related manager).

### Frontend Changes

#### MODIFY `frontend/components/circles/activity-feed.tsx`
For entries with `eventType === "marker_improved"`:
- Style the card with a green gradient background and a 🎉 celebration icon.
- Show the improved marker names prominently.
- Add a "Celebrate 🎉" button at the bottom.
  - On click: call `POST /api/circles/feed/{entry.id}/react`.
  - Toggle button state: show reaction count.
  - If `userHasReacted` is true, show button as filled/active style.

#### NEW `frontend/components/circles/milestone-toast.tsx`
When a new report is uploaded and the API response contains `lifestyleCorrelation.overallMessage` with positive impact OR when the dashboard poll detects a new `marker_improved` feed entry, show a toast notification:
- Fixed top-center, slides down from top.
- Green background: "✅ [MarkerName] is now in the normal range! Check your Circles feed."
- Auto-dismisses after 6 seconds.

---

## Phase 2 Migration & Run Checklist

1. `cd backend`
2. `python manage.py makemigrations users` (for LifestyleLog)
3. `python manage.py makemigrations circles` (for FeedReaction)
4. `python manage.py migrate`
5. `cd frontend && npm install` (for qrcode package)
6. `npm run dev`
7. **Test Feature 6:** Add a lifestyle log in Settings. Upload a new report. Open report detail → verify Lifestyle Correlation card appears.
8. **Test Feature 7:** Open any report with out-of-range markers → click "Get diet suggestions" → verify culturally relevant food advice appears.
9. **Test Feature 8:** Go to Trends → scroll down → verify Treatment Effectiveness section shows findings.
10. **Test Feature 9:** On dashboard → open Emergency Card `<details>` → verify QR code generated → click "Broadcast Aloud" → verify voice speaks.
11. **Test Feature 10:** Upload a second report where a previously abnormal marker is now normal → check Circles feed → verify 🎉 celebration entry appeared → verify "Celebrate" button works.

---

## Gemini API Key Distribution (Multi-Key Strategy)

Since you plan to use multiple Gemini API keys, assign each key to a specific feature set in `backend/.env`:

```env
# Key 1 — Heavy OCR & Extraction (high volume, fast model)
GEMINI_API_KEY_EXTRACTION=your_key_1
GEMINI_MODEL_VISION=gemini-1.5-flash

# Key 2 — Clinical Analysis & Predictions (quality-critical)
GEMINI_API_KEY_ANALYSIS=your_key_2
GEMINI_MODEL_TEXT=gemini-1.5-flash

# Key 3 — Conversational Chat (high-frequency)
GEMINI_API_KEY_CHAT=your_key_3
GEMINI_MODEL_CHAT=gemini-1.5-flash
```

#### MODIFY `backend/reports/services.py` — `GeminiService.__init__()`
```python
def __init__(self):
    self.extraction_model = self._make_model(settings.GEMINI_API_KEY_EXTRACTION, settings.GEMINI_MODEL_VISION, SYSTEM_PROMPT)
    self.analysis_model   = self._make_model(settings.GEMINI_API_KEY_ANALYSIS, settings.GEMINI_MODEL_TEXT, SYSTEM_PROMPT)
    self.chat_model       = self._make_model(settings.GEMINI_API_KEY_CHAT, settings.GEMINI_MODEL_TEXT, SYSTEM_PROMPT)

def _make_model(self, api_key, model_name, system_prompt):
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name, system_instruction=system_prompt)
```
Route: `extract_text_from_image` → `extraction_model`, `explain_report/correlate/diet/treatment` → `analysis_model`, `answer_chat/global_chat` → `chat_model`.

#### MODIFY `backend/projecthealth_backend/settings.py`
Add:
```python
GEMINI_API_KEY_EXTRACTION = env("GEMINI_API_KEY_EXTRACTION", env("GEMINI_API_KEY", ""))
GEMINI_API_KEY_ANALYSIS   = env("GEMINI_API_KEY_ANALYSIS",   env("GEMINI_API_KEY", ""))
GEMINI_API_KEY_CHAT       = env("GEMINI_API_KEY_CHAT",       env("GEMINI_API_KEY", ""))
GEMINI_MODEL_CHAT         = env("GEMINI_MODEL_CHAT", "gemini-1.5-flash")
```
This falls back gracefully to the single `GEMINI_API_KEY` if multiple keys are not yet configured.
