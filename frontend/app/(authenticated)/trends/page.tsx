"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  FileText,
  Filter,
  LineChart,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck
} from "lucide-react";
import {
  FormField,
  InlineValidation,
  MetricTile,
  PageHeader,
  SafetyNotice,
  SectionHeader,
  StatusBadge
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type ReportHistory = {
  id: number;
  document_title: string;
  source_date: string | null;
  health_score: number;
  health_status: string;
  biomarker_count: number;
  abnormal_biomarker_count: number;
};

type TimelineEvent = {
  id: number;
  event_type: string;
  title: string;
  summary: string;
  event_date: string;
  tags: string[];
  source_type: string;
  metadata: Record<string, unknown>;
};

type TrendInsight = {
  id: number;
  biomarker_name: string;
  biomarker_code: string;
  unit: string;
  label: string;
  report_count: number;
  first_value: number | null;
  latest_value: number | null;
  delta: number | null;
  graph_points: Array<{
    date: string;
    value: number;
    status: string;
    analysis_id: number;
    document_title: string;
  }>;
  risk_awareness: string[];
  doctor_prompts: string[];
  model_name: string;
  prompt_version: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

const eventTypes = ["report", "prescription", "symptom", "journal", "medicine", "doctor_summary", "emergency_share"];
const trendLabels = ["improving", "worsening", "stable", "fluctuating", "insufficient_data"];

export default function TrendsPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [year, setYear] = useState("");
  const [eventType, setEventType] = useState("all");
  const [biomarkerFilter, setBiomarkerFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("all");
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "refreshing" | "loaded" | "error">("loading");
  const [message, setMessage] = useState("");

  const selectedInsight = useMemo(
    () => insights.find((item) => item.id === selectedId) ?? insights[0] ?? null,
    [insights, selectedId]
  );

  const groupedEvents = useMemo(() => groupEvents(events), [events]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function refresh(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setStatus((current) => (current === "loading" ? "loading" : "refreshing"));
    setMessage("");

    const timelineParams = new URLSearchParams();
    if (year) timelineParams.set("year", year);
    if (eventType !== "all") timelineParams.set("type", eventType);
    if (biomarkerFilter) timelineParams.set("biomarker", biomarkerFilter);

    const biomarkerParams = new URLSearchParams();
    if (biomarkerFilter) biomarkerParams.set("biomarker", biomarkerFilter);
    if (labelFilter !== "all") biomarkerParams.set("label", labelFilter);

    try {
      await apiJson<unknown>("/health-trends/insights/", { method: "POST", token });

      const timelineQuery = timelineParams.toString() ? `?${timelineParams.toString()}` : "";
      const biomarkerQuery = biomarkerParams.toString() ? `?${biomarkerParams.toString()}` : "";
      const [reportData, timelineData, trendData] = await Promise.all([
        apiGet<ReportHistory[]>("/health-trends/reports/", token),
        apiGet<TimelineEvent[]>(`/health-trends/timeline/${timelineQuery}`, token),
        apiGet<TrendInsight[]>(`/health-trends/biomarkers/${biomarkerQuery}`, token)
      ]);
      setReports(reportData);
      setEvents(timelineData);
      setInsights(trendData);
      setSelectedId((current) => current ?? trendData[0]?.id ?? null);
      setStatus("loaded");
    } catch {
      setStatus("error");
      setMessage("Could not refresh trends. Check that you have analyzed reports available.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading health timeline" />
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
        eyebrow="Timeline And Trends"
        title="Follow Health Changes Across Time"
        description="Review report history, grouped timeline events, biomarker trend labels, and accessible data tables for doctor conversations."
        notice={
          <SafetyNotice title="Risk awareness only">
            Trends highlight patterns across your records. They do not diagnose a
            condition or determine treatment.
          </SafetyNotice>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <TimelineFilterBar
            biomarkerFilter={biomarkerFilter}
            eventType={eventType}
            labelFilter={labelFilter}
            status={status}
            year={year}
            onBiomarkerChange={setBiomarkerFilter}
            onEventTypeChange={setEventType}
            onLabelChange={setLabelFilter}
            onSubmit={refresh}
            onYearChange={setYear}
          />
          {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={FileText} title="Report History" description={`${reports.length} analyzed reports`} />
            <div className="mt-4 space-y-3">
              {reports.length === 0 ? (
                <EmptyState title="No report history" message="Analyze reports first to build health history." />
              ) : (
                reports.map((report) => (
                  <article className="rounded-md border border-claro-border p-3" key={report.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-claro-ink">{report.document_title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{report.source_date ? formatDate(report.source_date) : "No source date"}</p>
                      </div>
                      <StatusBadge tone={statusTone(report.health_status)}>{report.health_status.replaceAll("_", " ")}</StatusBadge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {report.abnormal_biomarker_count} abnormal of {report.biomarker_count} biomarkers · score {report.health_score}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Reports" value={reports.length} icon={Activity} />
            <MetricTile label="Trend insights" value={insights.length} icon={LineChart} tone="success" />
            <MetricTile label="Timeline events" value={events.length} icon={CalendarDays} tone="attention" />
          </div>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={CalendarDays} title="Health Timeline" description="Events are grouped by year and month for scan-friendly review." />
            <div className="mt-5 space-y-6">
              {groupedEvents.length === 0 ? (
                <EmptyState title="No timeline events" message="Run trend refresh after report analysis to populate the timeline." />
              ) : (
                groupedEvents.map((group) => (
                  <div key={group.key}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</h3>
                    <div className="mt-3 space-y-3 border-l border-claro-border pl-4">
                      {group.events.map((item) => (
                        <TimelineEventCard event={item} key={item.id} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={LineChart} title="Biomarker Trends" description="Labels summarize direction: improving, worsening, stable, fluctuating, or insufficient data." />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {insights.length === 0 ? (
                <EmptyState title="No trend insights" message="Analyze at least one report, then refresh trends." />
              ) : (
                insights.map((insight) => (
                  <button
                    className={cn(
                      "rounded-md border p-4 text-left transition",
                      selectedInsight?.id === insight.id ? "border-claro-blue bg-blue-50" : "border-claro-border bg-white hover:bg-slate-50"
                    )}
                    key={insight.id}
                    type="button"
                    onClick={() => setSelectedId(insight.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-claro-ink">{insight.biomarker_name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {insight.report_count} reports · delta {formatValue(insight.delta)} {insight.unit}
                        </p>
                      </div>
                      <TrendLabelBadge label={insight.label} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {selectedInsight ? <TrendDetail insight={selectedInsight} /> : null}
        </section>
      </div>
    </main>
  );
}

function TimelineFilterBar({
  biomarkerFilter,
  eventType,
  labelFilter,
  status,
  year,
  onBiomarkerChange,
  onEventTypeChange,
  onLabelChange,
  onSubmit,
  onYearChange
}: {
  biomarkerFilter: string;
  eventType: string;
  labelFilter: string;
  status: string;
  year: string;
  onBiomarkerChange: (value: string) => void;
  onEventTypeChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onYearChange: (value: string) => void;
}) {
  return (
    <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={onSubmit}>
      <SectionHeader icon={Filter} title="Timeline Filters" description="Filter by year, type, biomarker, or trend label." />
      <div className="mt-5 space-y-4">
        <FormField label="Year">
          <input className={inputClass} inputMode="numeric" placeholder="2026" value={year} onChange={(event) => onYearChange(event.target.value)} />
        </FormField>
        <FormField label="Event type">
          <select className={inputClass} value={eventType} onChange={(event) => onEventTypeChange(event.target.value)}>
            <option value="all">All event types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Biomarker">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className={`${inputClass} pl-9`} placeholder="LDL, glucose, hemoglobin" value={biomarkerFilter} onChange={(event) => onBiomarkerChange(event.target.value)} />
          </div>
        </FormField>
        <FormField label="Trend label">
          <select className={inputClass} value={labelFilter} onChange={(event) => onLabelChange(event.target.value)}>
            <option value="all">All labels</option>
            {trendLabels.map((label) => (
              <option key={label} value={label}>
                {label.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70"
          type="submit"
          disabled={status === "refreshing"}
        >
          {status === "refreshing" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Refresh trends
        </button>
      </div>
    </form>
  );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <article className="rounded-md border border-claro-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatDate(event.event_date)} · {event.event_type.replaceAll("_", " ")}
          </p>
          <h3 className="mt-1 font-semibold text-claro-ink">{event.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.tags.slice(0, 3).map((tag) => (
            <StatusBadge key={tag}>{tag}</StatusBadge>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{event.summary}</p>
    </article>
  );
}

function TrendDetail({ insight }: { insight: TrendInsight }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 border-b border-claro-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-claro-ink">{insight.biomarker_name}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {insight.model_name} · {insight.prompt_version} · {insight.report_count} reports
          </p>
        </div>
        <TrendLabelBadge label={insight.label} />
      </div>

      <TrendChart insight={insight} />
      <TrendDataTable insight={insight} />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <InfoPanel icon={<ShieldCheck className="h-4 w-4 text-claro-mint" aria-hidden />} title="Risk Awareness" items={insight.risk_awareness} />
        <InfoPanel icon={<MessageSquareText className="h-4 w-4 text-claro-blue" aria-hidden />} title="Doctor Discussion Prompts" items={insight.doctor_prompts} />
      </div>
    </section>
  );
}

function TrendChart({ insight }: { insight: TrendInsight }) {
  const points = insight.graph_points;
  const width = 640;
  const height = 220;
  const padding = 32;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const polyline = points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / spread) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-5 rounded-md bg-claro-muted p-4">
      <p className="text-sm leading-6 text-slate-700">
        {trendSummary(insight)}
      </p>
      {points.length < 2 ? (
        <p className="mt-4 text-sm text-slate-600">More reports are needed before a line chart is meaningful.</p>
      ) : (
        <svg className="mt-4 h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${insight.biomarker_name} trend chart. ${trendSummary(insight)}`}>
          <line stroke="#cbd5e1" strokeWidth="1" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
          <polyline fill="none" points={polyline} stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {points.map((point, index) => {
            const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
            const y = height - padding - ((point.value - min) / spread) * (height - padding * 2);
            return (
              <g key={`${point.date}-${point.value}`}>
                <circle cx={x} cy={y} fill="#059669" r="5" />
                <text fill="#475569" fontSize="12" textAnchor="middle" x={x} y={height - 8}>
                  {new Date(point.date).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function TrendDataTable({ insight }: { insight: TrendInsight }) {
  return (
    <div className="mt-5 overflow-hidden rounded-md border border-claro-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{insight.biomarker_name} trend data table</caption>
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3" scope="col">Date</th>
            <th className="px-3 py-3" scope="col">Value</th>
            <th className="px-3 py-3" scope="col">Status</th>
            <th className="px-3 py-3" scope="col">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-claro-border bg-white">
          {insight.graph_points.map((point) => (
            <tr key={`${point.analysis_id}-${point.date}`}>
              <td className="px-3 py-3 text-slate-700">{formatDate(point.date)}</td>
              <td className="px-3 py-3 font-medium text-claro-ink">{point.value} {insight.unit}</td>
              <td className="px-3 py-3"><StatusBadge tone={statusTone(point.status)}>{point.status.replaceAll("_", " ")}</StatusBadge></td>
              <td className="px-3 py-3 text-slate-700">{point.document_title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoPanel({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <section className="rounded-md border border-claro-border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-claro-ink">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No items generated.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TrendLabelBadge({ label }: { label: string }) {
  return <StatusBadge tone={labelTone(label)}>{label.replaceAll("_", " ")}</StatusBadge>;
}

function groupEvents(events: TimelineEvent[]) {
  const groups = new Map<string, { key: string; label: string; events: TimelineEvent[] }>();
  events.forEach((event) => {
    const date = new Date(event.event_date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const group = groups.get(key) ?? { key, label, events: [] };
    group.events.push(event);
    groups.set(key, group);
  });
  return Array.from(groups.values());
}

function trendSummary(insight: TrendInsight) {
  return `${insight.biomarker_name} is labeled ${insight.label.replaceAll("_", " ")} from ${insight.report_count} report${insight.report_count === 1 ? "" : "s"}. Latest value is ${formatValue(insight.latest_value)} ${insight.unit}; change is ${formatValue(insight.delta)} ${insight.unit}.`;
}

function formatValue(value: number | null) {
  return value === null ? "n/a" : Number(value).toLocaleString();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function statusTone(status: string): "neutral" | "info" | "success" | "attention" | "risk" | "critical" {
  if (status === "critical") return "critical";
  if (status === "needs_attention" || status === "borderline") return "attention";
  if (status === "worsening" || status === "high" || status === "low") return "risk";
  if (status === "normal" || status === "good" || status === "stable") return "success";
  return "neutral";
}

function labelTone(label: string): "neutral" | "info" | "success" | "attention" | "risk" | "critical" {
  if (label === "worsening") return "risk";
  if (label === "improving") return "success";
  if (label === "fluctuating") return "attention";
  if (label === "stable") return "info";
  return "neutral";
}
