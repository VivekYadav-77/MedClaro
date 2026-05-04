# MedClaro — Phase 1 Implementation Plan (Features 1–5)

> **Stack:** Django REST (backend) + Next.js App Router (frontend)
> **Zero external paid services.** All AI via Gemini free-tier keys.
> **DB:** SQLite (dev) / Postgres (prod) — no schema changes needed for existing tables except new models below.

---

## FEATURE 1 — Wire Real Interactive Chat (Fix Broken Stub)

### Problem
`frontend/components/reports/chat-panel.tsx` never calls the backend. It injects a hard-coded static string on every send.

### Backend — Already complete. No changes needed.
`POST /api/reports/{id}/chat` in `backend/reports/views.py → ReportChatView.post()` is fully implemented.

### Frontend Changes

#### MODIFY `frontend/components/reports/chat-panel.tsx`
Replace the entire file with:
- Add props: `reportId: string` and `language: string`.
- Add state: `loading: boolean`, `apiError: string | null`.
- `sendMessage()` async function:
  1. Guard: if `!draft.trim() || loading` return early.
  2. Optimistically append `{role:"user", content:draft}` to local `messages`.
  3. Clear `draft`, set `loading=true`, `apiError=null`.
  4. Call `fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/chat`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${accessToken}`}, body: JSON.stringify({message: draft}) })`.
  5. On success: append `{role:"assistant", content: data.message}` to messages.
  6. On error: set `apiError = "Could not reach assistant. Try again."` and remove the optimistic user message.
  7. `finally`: set `loading=false`.
- Use `useSession()` from `next-auth/react` for `accessToken`.
- Show `<Loader2 className="animate-spin" />` inside send button when `loading`.
- Show red error banner below chat when `apiError` is set.
- Remove ALL hard-coded static reply strings.

#### MODIFY `frontend/components/dashboard/report-detail-view.tsx`
- Import `ChatPanel` from `@/components/reports/chat-panel`.
- After the "Parameter Notes" section (after line 127), add:
```tsx
<ChatPanel
  reportId={displayReport._id}
  language={displayReport.language}
  initialMessages={displayReport.chatHistory}
/>
```

---

## FEATURE 2 — Full Prescription Detail UI (Fix Incomplete Display)

### Problem
`ReportDetailView` renders medications but hides `sideEffects`, `avoid`, `interactionNotes`.

#### MODIFY `frontend/components/dashboard/report-detail-view.tsx`
- Add import: `import { MedicationCard } from "@/components/reports/medication-card";`
- In the medications section (find the map over `displayReport.medications`), replace the plain `<div>` card with:
```tsx
{displayReport.medications?.length ? (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
      <Pill className="h-4 w-4 text-slate-500" /> Prescription Details
    </h3>
    {displayReport.medications.map((med) => (
      <MedicationCard key={med.name} medication={med} />
    ))}
  </section>
) : null}
```

---

## FEATURE 3 — Care Circles (Networked Family System)

### Concept
Replace the current single-user family profiles with a real multi-user network. Users can invite others by email. All members of a circle see a shared activity feed. When a report is uploaded, all circle members get a notification entry.

### Backend Changes

#### NEW `backend/circles/models.py`
```python
import uuid
from django.db import models
from django.conf import settings

class Circle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="owned_circles", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class CircleMember(models.Model):
    ROLE_CHOICES = [("admin", "Admin"), ("contributor", "Contributor"), ("viewer", "Viewer")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(Circle, related_name="members", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="circle_memberships", on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="viewer")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("circle", "user")

class CircleInvite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(Circle, related_name="invites", on_delete=models.CASCADE)
    invited_email_hash = models.CharField(max_length=64)  # SHA-256 of email, matches User.email_hash
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class ActivityFeedEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(Circle, related_name="feed", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    # event_type: "report_uploaded", "marker_improved", "milestone_achieved", "member_joined"
    event_type = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)  # e.g. {reportType, memberName, markerName, oldValue, newValue}
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    feed_entry = models.ForeignKey(ActivityFeedEntry, on_delete=models.CASCADE)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
```

#### NEW `backend/circles/serializers.py`
- `CircleSerializer`: fields `id, name, createdBy(name), memberCount, myRole`
- `CircleMemberSerializer`: fields `id, userId, name, role, joinedAt`
- `ActivityFeedSerializer`: fields `id, eventType, actorName, payload, createdAt`
- `NotificationSerializer`: fields `id, read, feedEntry(nested ActivityFeedSerializer), createdAt`

#### NEW `backend/circles/views.py`
```
CircleListCreateView       GET/POST  /api/circles
CircleDetailView           GET/DELETE /api/circles/{id}
CircleMemberView           GET       /api/circles/{id}/members
CircleInviteView           POST      /api/circles/{id}/invite  (body: {email})
CircleInviteAcceptView     POST      /api/circles/invite/{invite_id}/accept
CircleFeedView             GET       /api/circles/{id}/feed
NotificationListView       GET       /api/notifications        (all unread for current user)
NotificationMarkReadView   PUT       /api/notifications/{id}/read
```

#### MODIFY `backend/circles/views.py` — `CircleInviteView.post()`
- Hash the provided email with SHA-256 (same as `AuthService` hashing).
- Find a `User` with that `email_hash`. If not found, return 404 with message "User not registered".
- Create `CircleInvite`. Create a `Notification` for the invited user with `event_type="circle_invite"`.

#### MODIFY `backend/reports/services.py` — `ReportService.create_report()`
After `report = Report.objects.create(...)` succeeds, add:
```python
from circles.models import Circle, ActivityFeedEntry, Notification, CircleMember
# Find all circles the uploading user belongs to
for membership in CircleMember.objects.filter(user=current_user).select_related("circle"):
    entry = ActivityFeedEntry.objects.create(
        circle=membership.circle,
        actor=current_user,
        event_type="report_uploaded",
        payload={
            "reportType": parsed["report_type"],
            "reportId": str(report.id),
            "uploaderName": current_user.name,
            "familyMemberName": None,  # populate if family_member_id set
        }
    )
    # Notify all OTHER members in this circle
    other_members = CircleMember.objects.filter(circle=membership.circle).exclude(user=current_user)
    Notification.objects.bulk_create([
        Notification(user=m.user, feed_entry=entry) for m in other_members
    ])
```

#### MODIFY `backend/projecthealth_backend/settings.py`
Add `"circles"` to `INSTALLED_APPS`.

#### MODIFY `backend/projecthealth_backend/urls.py`
Add: `path(f"{settings.API_V1_PREFIX.strip('/')}/", include("circles.urls"))`

#### NEW `backend/circles/urls.py`
Wire all the views listed above.

#### RUN: `python manage.py makemigrations circles && python manage.py migrate`

### Frontend Changes

#### NEW `frontend/app/(app)/circles/page.tsx`
- Server component. Fetch `GET /api/circles`.
- Layout: Two-column on desktop.
  - Left column: List of user's circles (name, member count, role badge). Button: "Create Circle".
  - Right column: When a circle is selected, show its members list and "Invite by email" form.
- "Create Circle" opens a modal with a name input → calls `POST /api/circles`.
- "Invite" form: email input → calls `POST /api/circles/{id}/invite`.

#### NEW `frontend/components/circles/activity-feed.tsx`
- Client component that renders `ActivityFeedEntry[]`.
- Each entry is a row: avatar initial + event description + time ago.
- Event type renders differently:
  - `report_uploaded` → "👤 {actorName} uploaded a {reportType} report"
  - `marker_improved` → "✅ {memberName}'s {markerName} is now in the normal range!"
  - `member_joined` → "🎉 {name} joined the circle"

#### NEW `frontend/components/layout/notification-bell.tsx`
- Client component with `useEffect` that polls `GET /api/notifications` every 60 seconds.
- Shows a red dot badge on the bell icon when `unread > 0`.
- Clicking opens a dropdown showing the last 10 notifications.
- Each notification has a "Mark read" button → calls `PUT /api/notifications/{id}/read`.

#### MODIFY `frontend/components/layout/navbar.tsx`
- Import `NotificationBell` and render it in the right actions div alongside `FamilySwitcher`.

#### MODIFY `frontend/components/layout/navbar.tsx` — `navLinks` array
Add: `{ href: "/circles", label: "Circles" }`.

#### MODIFY `frontend/lib/types.ts`
Add types:
```ts
export type Circle = { id: string; name: string; memberCount: number; myRole: "admin"|"contributor"|"viewer" };
export type FeedEntry = { id: string; eventType: string; actorName: string; payload: Record<string,unknown>; createdAt: string };
export type AppNotification = { id: string; read: boolean; feedEntry: FeedEntry; createdAt: string };
```

---

## FEATURE 4 — Predictive AI Health Trajectories

### Concept
When the Trends page loads, pass the last 5 reports into Gemini and get a forward-looking "trajectory" object per tracked parameter.

### Backend Changes

#### MODIFY `backend/reports/services.py` — Add method to `GeminiService`
```python
def predict_trajectory(self, series_data: list[dict], language: str) -> dict:
    """
    series_data: list of {parameter, points:[{date,value,low,high}], normalizedUnit}
    Returns: {trajectories: [{parameter, direction:"improving"|"declining"|"stable",
              prediction: str, warningLevel:"none"|"watch"|"alert", advice: str}]}
    """
    prompt = f"""
    Analyze these health parameter series and return JSON with key 'trajectories'.
    Each trajectory must have: parameter, direction (improving/declining/stable),
    prediction (one sentence, plain language, future-looking),
    warningLevel (none/watch/alert based on rate of change and proximity to limits),
    advice (one actionable sentence, culturally neutral).
    Respond in language code {language}.
    Data: {json.dumps(series_data, default=str)}
    """
    raw = self.generate_json(prompt=prompt, report_text=json.dumps(series_data), report_type="trends")
    return json.loads(raw)
```

#### MODIFY `backend/reports/services.py` — `TrendService.build()`
At the end, before `return`, call:
```python
try:
    trajectory_data = GeminiService().predict_trajectory(series, language)
    trajectories = trajectory_data.get("trajectories", [])
except Exception:
    trajectories = []
```
Add `"trajectories": trajectories` to the return dict.

#### MODIFY `backend/reports/views.py` — `ReportTrendsView.get()`
Pass `language=request.user.preferred_language` into `TrendService().build(reports, language)`.

### Frontend Changes

#### MODIFY `frontend/lib/types.ts`
Add to `TrendResponse`:
```ts
trajectories: {
  parameter: string;
  direction: "improving" | "declining" | "stable";
  prediction: string;
  warningLevel: "none" | "watch" | "alert";
  advice: string;
}[];
```

#### NEW `frontend/components/reports/trajectory-card.tsx`
- Props: `trajectory` object.
- Card with colored left border: green=improving, amber=watch, red=alert, slate=stable.
- Shows: parameter name, direction arrow icon, prediction text, advice text.
- WarningLevel badge (color-coded).

#### MODIFY `frontend/app/(app)/trends/page.tsx`
After the charts grid, add a new section "AI Health Trajectories":
```tsx
{trends.trajectories?.length ? (
  <section className="space-y-4">
    <h2 className="font-display text-xl font-bold text-slate-900">AI Health Trajectories</h2>
    <p className="text-sm text-slate-500">Forward-looking analysis based on your report history.</p>
    <div className="grid gap-4 md:grid-cols-2">
      {trends.trajectories.map((t) => <TrajectoryCard key={t.parameter} trajectory={t} />)}
    </div>
  </section>
) : null}
```

---

## FEATURE 5 — Omni-Aware Global Health Chatbot

### Concept
A persistent chatbot accessible from anywhere in the app that has context of ALL the user's reports, ALL medications, and family member data — not just one report.

### Backend Changes

#### NEW `backend/reports/views.py` — `GlobalChatView`
```python
class GlobalChatView(APIView):
    def post(self, request):
        from reports.services import ReportService, ReportHydrator, GeminiService, RateLimiter
        RateLimiter().enforce(request.user, "global_chat", settings.CHAT_LIMIT_PER_DAY)
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "message required"}, status=400)
        hydrator = ReportHydrator()
        all_reports = [hydrator.hydrate(r) for r in
                       Report.objects.filter(user=request.user).prefetch_related("chat_messages")[:10]]
        # Build a compact health state summary to stay within token budget
        health_state = {
            "reportCount": len(all_reports),
            "reports": [
                {
                    "type": r["reportType"],
                    "date": str(r.get("reportDate") or r["uploadDate"])[:10],
                    "abnormalMarkers": [
                        {"name": p["testName"], "value": p["value"], "unit": p["unit"], "flag": p["flag"]}
                        for p in r["structuredData"] if p.get("flag") != "normal"
                    ],
                    "medications": [m["name"] for m in (r.get("medications") or [])],
                    "summary": r["aiExplanation"].get("holisticSummary", ""),
                }
                for r in all_reports
            ]
        }
        language = request.user.preferred_language
        prompt = f"""
You are a personal health assistant with full access to the user's medical history.
Answer only based on the provided health state. Cite specific values when relevant.
If asked about something not in the data, say so plainly.
Never diagnose. Respond in language code {language}.
User question: {message}
Health state: {json.dumps(health_state, default=str)}
"""
        try:
            ai = GeminiService()
            response = ai.text_model.generate_content(
                prompt,
                generation_config={"temperature": 0.2},
                request_options={"timeout": 30},
            )
            answer = response.text.strip()
        except Exception:
            answer = "I'm having trouble connecting right now. Please try again in a moment."
        return Response({"message": answer})
```

#### MODIFY `backend/reports/urls.py`
Add: `path("reports/chat", GlobalChatView.as_view())`

### Frontend Changes

#### NEW `frontend/components/layout/global-chat-widget.tsx`
- Client component. State: `open: boolean`, `messages: {role,content}[]`, `draft: string`, `loading: boolean`.
- **Trigger:** A floating button fixed bottom-right. Icon: `MessageCircle`. Pill label: "Ask MedClaro".
- On click: toggles a slide-up panel (max-w-sm, fixed bottom-right above the button).
- Send handler calls `POST /api/reports/chat` with `{message: draft}`.
- Shows loading spinner while waiting.
- Panel header: "Your Health Assistant" + close X button.
- Message bubbles same styling as `chat-panel.tsx` but no report scoping.

#### MODIFY `frontend/components/layout/app-shell.tsx`
Import and render `<GlobalChatWidget />` as the last child inside the outer div, so it appears on every authenticated page:
```tsx
import { GlobalChatWidget } from "@/components/layout/global-chat-widget";

// Inside return:
<div className="min-h-screen bg-slate-50">
  <Navbar user={user} />
  <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-fade-in">
    {children}
  </main>
  <GlobalChatWidget />
</div>
```

---

## Phase 1 Migration & Run Checklist

1. `cd backend`
2. `python manage.py makemigrations circles`
3. `python manage.py migrate`
4. Verify all new API endpoints respond correctly.
5. `cd frontend && npm run dev`
6. Verify chat sends real messages, MedicationCard shows full detail, notification bell appears.
