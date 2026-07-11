"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Bot,
  HeartPulse,
  Loader2,
  MessageCircle,
  Pill,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from "lucide-react";

type HubAlert = {
  kind: string;
  title: string;
  summary: string;
  severity: string;
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
};

type Conversation = {
  id: number;
  title: string;
  model_name: string;
  prompt_version: string;
  safety_review_required: boolean;
  safety_review_notes: string[];
  messages: AssistantMessage[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

function statusClass(status: string) {
  if (status === "critical" || status === "high" || status === "worsening") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (status === "moderate" || status === "fluctuating" || status === "needs_attention") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export default function HubPage() {
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

  async function loadDashboard() {
    setStatus("loading");
    try {
      const response = await fetch(`${API_URL}/health-hub/dashboard/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      if (!response.ok) {
        throw new Error("Could not load dashboard");
      }
      setDashboard((await response.json()) as Dashboard);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch(`${API_URL}/health-hub/assistant/turns/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {})
        },
        body: JSON.stringify({
          message,
          ...(conversation ? { conversation_id: conversation.id } : {})
        })
      });
      if (!response.ok) {
        throw new Error("Could not send assistant message");
      }
      setConversation((await response.json()) as Conversation);
      setMessage("");
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
                Central Health Hub
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Your Health Context In One Place
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Review profile readiness, recent reports, prescriptions, trends,
                reminders, timeline events, and a context-aware assistant.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                Safety reviewed answers
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sensitive questions are flagged and answered with care guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Hub Access
              </h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                API token
                <input
                  className={inputClass}
                  placeholder="Paste token from registration/login"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
              </label>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={loadDashboard}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Load Hub
              </button>
              {status === "error" ? (
                <p className="flex items-center gap-2 text-sm font-medium text-claro-rose">
                  <AlertCircle className="h-4 w-4" />
                  Request failed. Check token and available health data.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-claro-mint" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Health Assistant
              </h2>
            </div>
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
              {!conversation ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  Ask a question after entering your token. The assistant uses
                  your MedClaro context snapshot.
                </p>
              ) : (
                conversation.messages.map((item) => (
                  <article
                    className={`rounded-md p-3 text-sm leading-6 ${
                      item.role === "user"
                        ? "bg-claro-blue text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                    key={item.id}
                  >
                    {item.content}
                    {item.safety_flags.length > 0 ? (
                      <p className="mt-2 text-xs font-semibold uppercase">
                        Safety flags: {item.safety_flags.join(", ")}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
            <form className="mt-4 space-y-3" onSubmit={sendMessage}>
              <textarea
                className={inputClass}
                placeholder="Ask about top alerts, reports, medicines, or trends"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
                disabled={status === "loading"}
              >
                <MessageCircle className="h-4 w-4" />
                Send
              </button>
            </form>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="Profile"
              value={`${dashboard?.profile.completion_percentage ?? 0}%`}
              icon={<HeartPulse className="h-4 w-4 text-claro-blue" />}
            />
            <Metric
              label="Health Score"
              value={dashboard?.health_score?.toString() ?? "n/a"}
              icon={<Activity className="h-4 w-4 text-claro-mint" />}
            />
            <Metric
              label="Alerts"
              value={(dashboard?.alerts.length ?? 0).toString()}
              icon={<AlertCircle className="h-4 w-4 text-claro-rose" />}
            />
            <Metric
              label="Reminders"
              value={(dashboard?.upcoming_reminders.length ?? 0).toString()}
              icon={<Bell className="h-4 w-4 text-claro-blue" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Ranked Alerts" icon={<AlertCircle className="h-4 w-4 text-claro-rose" />}>
              {dashboard?.alerts.length ? (
                dashboard.alerts.map((alert) => (
                  <article className="rounded-md border border-slate-200 p-3" key={`${alert.kind}-${alert.title}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${statusClass(alert.severity)}`}>
                        {alert.severity.replace("_", " ")}
                      </span>
                      <h3 className="text-sm font-semibold text-claro-ink">
                        {alert.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {alert.summary}
                    </p>
                  </article>
                ))
              ) : (
                <Empty text="No ranked alerts loaded yet." />
              )}
            </Panel>

            <Panel title="AI Suggestions" icon={<Sparkles className="h-4 w-4 text-claro-mint" />}>
              {dashboard?.suggestions.length ? (
                dashboard.suggestions.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.title}>
                    <h3 className="text-sm font-semibold text-claro-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.reason}
                    </p>
                  </article>
                ))
              ) : (
                <Empty text="Suggestions appear after hub data is loaded." />
              )}
            </Panel>

            <Panel title="Upcoming Medicine Reminders" icon={<Pill className="h-4 w-4 text-claro-blue" />}>
              {dashboard?.upcoming_reminders.length ? (
                dashboard.upcoming_reminders.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <h3 className="text-sm font-semibold text-claro-ink">
                      {item.medicine}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.dosage} - {item.frequency}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                      {item.reminder_status}
                    </p>
                  </article>
                ))
              ) : (
                <Empty text="No reminder plans loaded yet." />
              )}
            </Panel>

            <Panel title="Recent Timeline" icon={<Activity className="h-4 w-4 text-claro-mint" />}>
              {dashboard?.timeline.length ? (
                dashboard.timeline.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {item.event_date} - {item.event_type}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-claro-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.summary}
                    </p>
                  </article>
                ))
              ) : (
                <Empty text="Timeline events appear after reports or prescriptions are analyzed." />
              )}
            </Panel>
          </div>

          {conversation?.safety_review_required ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <ShieldCheck className="h-4 w-4" />
                Sensitive Answer State
              </div>
              <ul className="mt-3 space-y-2 text-sm text-amber-800">
                {conversation.safety_review_notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-claro-ink">{value}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
      {text}
    </p>
  );
}
