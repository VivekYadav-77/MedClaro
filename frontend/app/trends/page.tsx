"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Filter,
  LineChart,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

function labelClass(label: string) {
  if (label === "worsening") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (label === "improving") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (label === "fluctuating") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function TrendsPage() {
  const [token, setToken] = useState("");
  const [year, setYear] = useState("");
  const [biomarkerFilter, setBiomarkerFilter] = useState("");
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

  const selectedInsight = useMemo(
    () => insights.find((item) => item.id === selectedId) ?? insights[0] ?? null,
    [insights, selectedId]
  );

  async function fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Token ${token}` } : {}
    });
    if (!response.ok) {
      throw new Error("Request failed");
    }
    return response.json() as Promise<T>;
  }

  async function refresh(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setStatus("loading");

    const timelineParams = new URLSearchParams();
    if (year) {
      timelineParams.set("year", year);
    }
    if (biomarkerFilter) {
      timelineParams.set("biomarker", biomarkerFilter);
    }
    const biomarkerParams = new URLSearchParams();
    if (biomarkerFilter) {
      biomarkerParams.set("biomarker", biomarkerFilter);
    }

    try {
      const refreshResponse = await fetch(`${API_URL}/health-trends/insights/`, {
        method: "POST",
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      if (!refreshResponse.ok) {
        throw new Error("Could not refresh trends");
      }

      const timelineQuery = timelineParams.toString()
        ? `?${timelineParams.toString()}`
        : "";
      const biomarkerQuery = biomarkerParams.toString()
        ? `?${biomarkerParams.toString()}`
        : "";
      const [reportData, timelineData, trendData] = await Promise.all([
        fetchJson<ReportHistory[]>("/health-trends/reports/"),
        fetchJson<TimelineEvent[]>(`/health-trends/timeline/${timelineQuery}`),
        fetchJson<TrendInsight[]>(`/health-trends/biomarkers/${biomarkerQuery}`)
      ]);
      setReports(reportData);
      setEvents(timelineData);
      setInsights(trendData);
      setSelectedId(trendData[0]?.id ?? null);
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
                Trends And Timeline
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Follow Health Changes Across Reports
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Compare biomarker history, generate graph-ready trend data, and
                prepare non-diagnostic doctor discussion prompts.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                Risk awareness only
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Trends highlight patterns without diagnosing conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={refresh}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Timeline Filters
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
              <label className="block text-sm font-medium text-slate-700">
                Year
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="2026"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Biomarker
                <input
                  className={inputClass}
                  placeholder="LDL, glucose, hemoglobin"
                  value={biomarkerFilter}
                  onChange={(event) => setBiomarkerFilter(event.target.value)}
                />
              </label>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Trends
              </button>
              {status === "error" ? (
                <p className="flex items-center gap-2 text-sm font-medium text-claro-rose">
                  <AlertCircle className="h-4 w-4" />
                  Request failed. Check token and available report analyses.
                </p>
              ) : null}
            </div>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-claro-mint" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Health Timeline
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {events.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  No timeline events loaded yet.
                </p>
              ) : (
                events.map((item) => (
                  <article
                    className="rounded-md border border-slate-200 p-3"
                    key={item.id}
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {item.event_date} - {item.event_type}
                    </p>
                    <h3 className="mt-1 font-semibold text-claro-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.summary}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Reports"
              value={reports.length.toString()}
              icon={<Activity className="h-4 w-4 text-claro-blue" />}
            />
            <Metric
              label="Trend Insights"
              value={insights.length.toString()}
              icon={<LineChart className="h-4 w-4 text-claro-mint" />}
            />
            <Metric
              label="Timeline Events"
              value={events.length.toString()}
              icon={<CalendarDays className="h-4 w-4 text-claro-blue" />}
            />
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Biomarker Trends
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {insights.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600 md:col-span-2">
                  Refresh trends after at least one analyzed report exists.
                </p>
              ) : (
                insights.map((insight) => (
                  <button
                    className="rounded-md border border-slate-200 p-4 text-left transition hover:bg-slate-50"
                    key={insight.id}
                    type="button"
                    onClick={() => setSelectedId(insight.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-claro-ink">
                          {insight.biomarker_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {insight.report_count} reports - delta{" "}
                          {insight.delta ?? "n/a"} {insight.unit}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${labelClass(
                          insight.label
                        )}`}
                      >
                        {insight.label.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {selectedInsight ? (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-claro-ink">
                    {selectedInsight.biomarker_name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedInsight.model_name} - {selectedInsight.prompt_version}
                  </p>
                </div>
                <span
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ring-1 ${labelClass(
                    selectedInsight.label
                  )}`}
                >
                  {selectedInsight.label.replace("_", " ")}
                </span>
              </div>

              <TrendGraph insight={selectedInsight} />

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <InfoPanel
                  title="Risk Awareness"
                  items={selectedInsight.risk_awareness}
                />
                <InfoPanel
                  title="Doctor Prompts"
                  icon={<MessageSquareText className="h-4 w-4 text-claro-blue" />}
                  items={selectedInsight.doctor_prompts}
                />
              </div>
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

function TrendGraph({ insight }: { insight: TrendInsight }) {
  const points = insight.graph_points;
  const width = 520;
  const height = 180;
  const padding = 24;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const polyline = points
    .map((point, index) => {
      const x =
        padding +
        (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y =
        height - padding - ((point.value - min) / spread) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-5 rounded-md bg-slate-50 p-4">
      {points.length < 2 ? (
        <p className="text-sm text-slate-600">
          More reports are needed before a trend graph is meaningful.
        </p>
      ) : (
        <svg
          className="h-auto w-full"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${insight.biomarker_name} trend graph`}
        >
          <line
            stroke="#cbd5e1"
            strokeWidth="1"
            x1={padding}
            x2={width - padding}
            y1={height - padding}
            y2={height - padding}
          />
          <polyline
            fill="none"
            points={polyline}
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {points.map((point, index) => {
            const x =
              padding +
              (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
            const y =
              height -
              padding -
              ((point.value - min) / spread) * (height - padding * 2);
            return (
              <g key={`${point.date}-${point.value}`}>
                <circle cx={x} cy={y} fill="#10b981" r="5" />
                <text
                  fill="#475569"
                  fontSize="11"
                  textAnchor="middle"
                  x={x}
                  y={height - 6}
                >
                  {new Date(point.date).toLocaleDateString(undefined, {
                    month: "short",
                    year: "2-digit"
                  })}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function InfoPanel({
  title,
  items,
  icon
}: {
  title: string;
  items: string[];
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-claro-ink">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
