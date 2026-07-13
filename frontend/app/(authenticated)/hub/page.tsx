"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Bell,
  Bot,
  CalendarDays,
  HeartPulse,
  Loader2,
  MessageCircle,
  Pill,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from "lucide-react";
import {
  InlineValidation,
  MetricTile,
  PageHeader,
  PermissionNotice,
  SafetyNotice,
  SectionHeader,
  StatusBadge
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type HubAlert = {
  kind: string;
  title: string;
  summary: string;
  severity: string;
  priority?: number;
};

type HubSuggestion = {
  title: string;
  reason: string;
  action: string;
};

type TimelineItem = {
  id: number;
  event_type: string;
  title: string;
  summary: string;
  event_date: string;
  tags?: string[];
};

type Reminder = {
  id: number;
  medicine: string;
  dosage: string;
  frequency: string;
  timing: string[];
  reminder_status: string;
};

type Dashboard = {
  profile: {
    exists: boolean;
    completion_percentage: number;
    allergy_count?: number;
    condition_count?: number;
    privacy_consent?: boolean;
  };
  health_score: number | null;
  health_status: string;
  latest_report: Record<string, unknown>;
  latest_prescription: Record<string, unknown>;
  trend_alerts: Array<Record<string, unknown>>;
  upcoming_reminders: Reminder[];
  alerts: HubAlert[];
  suggestions: HubSuggestion[];
  timeline: TimelineItem[];
  family_updates: Array<Record<string, unknown>>;
  empty_states: Record<string, string>;
};

type AssistantMessage = {
  id: number;
  role: string;
  content: string;
  safety_flags: string[];
  cited_context: Record<string, number>;
};

type Conversation = {
  id: number;
  title: string;
  context_snapshot: AssistantContext;
  model_name: string;
  prompt_version: string;
  safety_review_required: boolean;
  safety_review_notes: string[];
  messages: AssistantMessage[];
};

type AssistantContext = {
  recent_reports?: unknown[];
  biomarker_trends?: unknown[];
  current_medicines?: unknown[];
  prescription_warnings?: unknown[];
  symptoms_and_journal?: {
    recent_symptoms?: unknown[];
    recent_journal?: unknown[];
  };
  assembled_at?: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function HubPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sending" | "loaded" | "error">("loading");
  const [error, setError] = useState("");

  const topAlert = dashboard?.alerts[0] ?? null;
  const todayActions = useMemo(() => buildTodayActions(dashboard), [dashboard]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function loadHub() {
    setStatus("loading");
    setError("");
    try {
      const [dashboardData, contextData] = await Promise.all([
        apiGet<Dashboard>("/health-hub/dashboard/", token),
        apiGet<AssistantContext>("/health-hub/memory-context/", token)
      ]);
      setDashboard(dashboardData);
      setContext(contextData);
      setStatus("loaded");
    } catch {
      setStatus("error");
      setError("Could not load your Health Hub. Check your session and try again.");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const nextConversation = await apiJson<Conversation>("/health-hub/assistant/turns/", {
        method: "POST",
        token,
        body: {
          message: message.trim(),
          ...(conversation ? { conversation_id: conversation.id } : {})
        }
      });
      setConversation(nextConversation);
      setContext(nextConversation.context_snapshot);
      setMessage("");
      setStatus("loaded");
    } catch {
      setStatus("error");
      setError("Assistant request failed. Try again after refreshing your Hub.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading Health Hub" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <button className="min-h-11 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white" type="button" onClick={() => router.push("/signin")}>
              Sign in
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-claro-background">
      <PageHeader
        eyebrow="Health Hub"
        title="Today In Your MedClaro Memory"
        description="Start here for ranked alerts, next actions, recent changes, reminders, and an assistant that explains what context it used."
        actions={
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="button" onClick={loadHub}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          topAlert ? (
            <SafetyNotice title={topAlert.title} tone={topAlert.severity === "critical" || topAlert.severity === "high" ? "risk" : "attention"}>
              {topAlert.summary}
            </SafetyNotice>
          ) : (
            <PermissionNotice title="Private health command center">
              Your Hub is assembled from your profile, reports, medicines, trends, symptoms, and journal entries.
            </PermissionNotice>
          )
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="space-y-6">
          <HubStatusBand dashboard={dashboard} />

          {status === "error" ? <InlineValidation>{error}</InlineValidation> : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <RankedAlertList alerts={dashboard?.alerts ?? []} />
            <TodayActionList actions={todayActions} onNavigate={(path) => router.push(path)} />
          </div>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={CalendarDays} title="Recent Timeline" description="What changed recently across reports, prescriptions, symptoms, journal, and future shared events." />
            <div className="mt-4 space-y-3">
              {dashboard?.timeline.length ? (
                dashboard.timeline.map((item) => <TimelineRow item={item} key={item.id} />)
              ) : (
                <EmptyState title="No recent timeline yet" message="Analyze reports, prescriptions, or add daily health logs to build your timeline." />
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <SnapshotPanel title="Trend Snapshot" value={`${dashboard?.trend_alerts.length ?? 0} alerts`} detail={firstText(dashboard?.trend_alerts[0], "biomarker") || "No worsening or fluctuating trends loaded."} />
            <SnapshotPanel title="Latest Report" value={String(dashboard?.latest_report?.health_score ?? "n/a")} detail={firstText(dashboard?.latest_report, "document_title") || "No analyzed report yet."} />
            <SnapshotPanel title="Latest Prescription" value={`${Number(dashboard?.latest_prescription?.medication_count ?? 0)} meds`} detail={firstText(dashboard?.latest_prescription, "document_title") || "No prescription analysis yet."} />
          </div>
        </section>

        <aside className="space-y-6">
          <AssistantThread
            context={context}
            conversation={conversation}
            message={message}
            status={status}
            onMessageChange={setMessage}
            onSubmit={sendMessage}
          />
          <ReminderList reminders={dashboard?.upcoming_reminders ?? []} />
          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={ShieldCheck} title="Family Updates" description={dashboard?.empty_states.family_updates ?? "Family updates will appear here when shared access is enabled."} />
          </section>
        </aside>
      </div>
    </main>
  );
}

function HubStatusBand({ dashboard }: { dashboard: Dashboard | null }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">Today</p>
          <h2 className="mt-2 text-2xl font-semibold text-claro-ink">What needs attention first?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            MedClaro is remembering {dashboard?.profile.allergy_count ?? 0} allergies, {dashboard?.profile.condition_count ?? 0} conditions, {dashboard?.upcoming_reminders.length ?? 0} medicine reminders, and {dashboard?.alerts.length ?? 0} ranked alerts.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[520px]">
          <MetricTile icon={HeartPulse} label="Health score" value={dashboard?.health_score ?? "n/a"} detail={dashboard?.health_status?.replaceAll("_", " ") ?? "unknown"} />
          <MetricTile icon={Activity} label="Profile" value={`${dashboard?.profile.completion_percentage ?? 0}%`} detail={dashboard?.profile.privacy_consent ? "Consent ready" : "Review consent"} tone={dashboard?.profile.privacy_consent ? "success" : "attention"} />
          <MetricTile icon={AlertCircle} label="Alerts" value={dashboard?.alerts.length ?? 0} detail="Ranked by severity" tone={(dashboard?.alerts.length ?? 0) > 0 ? "attention" : "success"} />
        </div>
      </div>
    </section>
  );
}

function RankedAlertList({ alerts }: { alerts: HubAlert[] }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={ShieldAlert} title="Ranked Alerts" description="Medication and trend prompts sorted so urgent items stay visible." />
      <div className="mt-4 space-y-3">
        {alerts.length ? (
          alerts.map((alert) => (
            <article className="rounded-md border border-claro-border p-4" key={`${alert.kind}-${alert.title}`}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={severityTone(alert.severity)}>{alert.severity.replaceAll("_", " ")}</StatusBadge>
                <h3 className="font-semibold text-claro-ink">{alert.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{alert.summary}</p>
            </article>
          ))
        ) : (
          <EmptyState title="No ranked alerts" message="Your top medication and trend alerts will appear here." />
        )}
      </div>
    </section>
  );
}

function TodayActionList({
  actions,
  onNavigate
}: {
  actions: HubSuggestion[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Sparkles} title="Today Actions" description="Practical next steps based on the current Hub snapshot." />
      <div className="mt-4 space-y-3">
        {actions.length ? (
          actions.map((item) => (
            <button className="w-full rounded-md border border-claro-border p-4 text-left transition hover:bg-slate-50" key={item.title} type="button" onClick={() => onNavigate(item.action)}>
              <span className="block font-semibold text-claro-ink">{item.title}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{item.reason}</span>
            </button>
          ))
        ) : (
          <EmptyState title="No suggested actions" message="Complete your profile or add records to unlock more useful next steps." />
        )}
      </div>
    </section>
  );
}

function AssistantThread({
  context,
  conversation,
  message,
  status,
  onMessageChange,
  onSubmit
}: {
  context: AssistantContext | null;
  conversation: Conversation | null;
  message: string;
  status: string;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const messages = conversation?.messages ?? [];
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Bot} title="Health Assistant" description="Answers include context counts, cited modules, and safety flags when applicable." />
      <ContextSnapshot context={context} />
      <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
        {messages.length ? (
          messages.map((item) => (
            <article
              className={cn(
                "rounded-md p-3 text-sm leading-6",
                item.role === "user" ? "bg-claro-blue text-white" : "bg-claro-muted text-slate-700"
              )}
              key={item.id}
            >
              {item.content}
              {Object.keys(item.cited_context ?? {}).length ? (
                <p className="mt-2 text-xs font-semibold uppercase">
                  Cited: {Object.entries(item.cited_context).map(([key, value]) => `${key.replaceAll("_", " ")} ${value}`).join(", ")}
                </p>
              ) : null}
              {item.safety_flags.length ? (
                <p className="mt-2 text-xs font-semibold uppercase">
                  Safety flags: {item.safety_flags.join(", ")}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState title="Ask with context" message="Try asking what needs attention today, what to discuss with your doctor, or how medicines relate to recent reports." />
        )}
      </div>
      {conversation?.safety_review_required ? (
        <SafetyNotice title="Sensitive topic guidance" tone="attention">
          {conversation.safety_review_notes.join(" ")}
        </SafetyNotice>
      ) : null}
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <textarea
          className={inputClass}
          placeholder="Ask about alerts, reports, medicines, symptoms, or trends"
          rows={4}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
        />
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={!message.trim() || status === "sending"}
        >
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
          Send
        </button>
      </form>
    </section>
  );
}

function ContextSnapshot({ context }: { context: AssistantContext | null }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-claro-muted p-3 text-sm">
      <SnapshotCount label="Reports" value={context?.recent_reports?.length ?? 0} />
      <SnapshotCount label="Medicines" value={context?.current_medicines?.length ?? 0} />
      <SnapshotCount label="Trends" value={context?.biomarker_trends?.length ?? 0} />
      <SnapshotCount label="Symptoms" value={context?.symptoms_and_journal?.recent_symptoms?.length ?? 0} />
    </div>
  );
}

function SnapshotCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-claro-ink">{value}</p>
      <p className="text-slate-600">{label}</p>
    </div>
  );
}

function ReminderList({ reminders }: { reminders: Reminder[] }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Bell} title="Medicine Reminders" description="Upcoming active or planned schedules." />
      <div className="mt-4 space-y-3">
        {reminders.length ? (
          reminders.map((item) => (
            <article className="rounded-md border border-claro-border p-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-claro-ink">{item.medicine}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.dosage} · {item.frequency}</p>
                </div>
                <StatusBadge tone={item.reminder_status === "active" ? "success" : "info"}>{item.reminder_status}</StatusBadge>
              </div>
              {item.timing.length ? <p className="mt-2 text-sm text-slate-600">{item.timing.join(", ")}</p> : null}
            </article>
          ))
        ) : (
          <EmptyState title="No reminders yet" message="Prescription schedules will appear here after analysis." />
        )}
      </div>
    </section>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  return (
    <article className="rounded-md border border-claro-border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDate(item.event_date)} · {item.event_type.replaceAll("_", " ")}</p>
          <h3 className="mt-1 font-semibold text-claro-ink">{item.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(item.tags ?? []).slice(0, 3).map((tag) => <StatusBadge key={tag}>{tag}</StatusBadge>)}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
    </article>
  );
}

function SnapshotPanel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-claro-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </section>
  );
}

function buildTodayActions(dashboard: Dashboard | null): HubSuggestion[] {
  if (!dashboard) return [];
  const actions = [...dashboard.suggestions];
  if (dashboard.upcoming_reminders.length) {
    actions.unshift({
      title: "Review medicine reminders",
      reason: `${dashboard.upcoming_reminders.length} planned or active reminder schedules need routine follow-through.`,
      action: "/prescriptions"
    });
  }
  if (dashboard.alerts.length) {
    actions.unshift({
      title: "Ask assistant to summarize top alerts",
      reason: "Turn medication and trend warnings into a concise doctor discussion agenda.",
      action: "/hub"
    });
  }
  return actions.slice(0, 5);
}

function firstText(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function severityTone(severity: string): "neutral" | "info" | "success" | "attention" | "risk" | "critical" {
  if (severity === "critical") return "critical";
  if (severity === "high" || severity === "worsening") return "risk";
  if (severity === "moderate" || severity === "fluctuating" || severity === "needs_attention") return "attention";
  if (severity === "low" || severity === "info") return "info";
  return "success";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
