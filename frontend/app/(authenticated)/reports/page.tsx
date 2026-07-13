"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  BrainCircuit,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  Loader2,
  ShieldAlert,
  Stethoscope
} from "lucide-react";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";

type Biomarker = {
  id: number;
  name: string;
  code: string;
  value: string;
  unit: string;
  normal_range: string;
  status: string;
  severity: number;
  summary: string;
  explanations: Record<string, string>;
  recommendations: string[];
};

type ReportAnalysis = {
  id: number;
  document: number;
  document_title: string;
  status: string;
  health_score: number;
  health_status: string;
  key_findings: string[];
  food_guidance: string[];
  lifestyle_guidance: string[];
  doctor_prompts: string[];
  disclaimer: string;
  safety_review_required: boolean;
  safety_review_notes: string[];
  model_name: string;
  prompt_version: string;
  source_document_reference: string;
  created_at: string;
  biomarkers: Biomarker[];
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

const explanationLabels: Record<string, string> = {
  explain_to_grandma: "Grandma",
  simple: "Simple",
  detailed: "Detailed",
  medical_student: "Medical Student",
  doctor_mode: "Doctor Mode"
};

function statusClass(status: string) {
  if (status === "critical") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (status === "needs_attention") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export default function ReportsPage() {
  const { token } = useSession();
  const [documentId, setDocumentId] = useState("");
  const [analyses, setAnalyses] = useState<ReportAnalysis[]>([]);
  const [selected, setSelected] = useState<ReportAnalysis | null>(null);
  const [expandedMarker, setExpandedMarker] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );

  async function loadAnalyses() {
    setStatus("loading");
    try {
      const data = await apiGet<ReportAnalysis[]>("/report-analyses/", token);
      setAnalyses(data);
      setSelected(data[0] ?? null);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const analysis = await apiJson<ReportAnalysis>("/report-analyses/", {
        method: "POST",
        token,
        body: { document_id: Number(documentId) }
      });
      setSelected(analysis);
      setAnalyses((current) => [
        analysis,
        ...current.filter((item) => item.id !== analysis.id)
      ]);
      setExpandedMarker(analysis.biomarkers[0]?.id ?? null);
      setStatus("saved");
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
                AI Report Analysis
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Turn Lab Reports Into Structured Health Intelligence
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Analyze uploaded lab reports, extract biomarkers, compare normal
                ranges, and prepare safer doctor-ready follow-up questions.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <BrainCircuit className="h-4 w-4 text-claro-blue" />
                gemini-3.1-flash-lite boundary
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current pipeline stores prompt version, model name, safety notes,
                and source document metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={runAnalysis}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Run Analysis
              </h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Lab report document ID
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={documentId}
                  onChange={(event) => setDocumentId(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  type="submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BrainCircuit className="h-4 w-4" />
                  )}
                  Analyze
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={loadAnalyses}
                >
                  Load Results
                </button>
              </div>
              {status === "error" ? (
                <p className="flex items-center gap-2 text-sm font-medium text-claro-rose">
                  <AlertCircle className="h-4 w-4" />
                  Request failed. Check your session and lab report document ID.
                </p>
              ) : null}
            </div>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Result History
            </h2>
            <div className="mt-4 space-y-3">
              {analyses.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  No analyses loaded yet.
                </p>
              ) : (
                analyses.map((analysis) => (
                  <button
                    className="w-full rounded-md border border-slate-200 p-3 text-left transition hover:bg-slate-50"
                    key={analysis.id}
                    type="button"
                    onClick={() => setSelected(analysis)}
                  >
                    <span className="block text-sm font-semibold text-claro-ink">
                      {analysis.document_title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Score {analysis.health_score} - {analysis.health_status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          {!selected ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 text-center">
              <HeartPulse className="h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Run or load a report analysis to view health intelligence.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {selected.source_document_reference}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-claro-ink">
                    {selected.document_title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {selected.model_name} - {selected.prompt_version}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-slate-200 px-4 py-3 text-center">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Score
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-claro-ink">
                      {selected.health_score}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ring-1 ${statusClass(
                      selected.health_status
                    )}`}
                  >
                    {selected.health_status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selected.safety_review_required ? (
                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <ShieldAlert className="h-4 w-4" />
                    Safety review applied
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-amber-800">
                    {selected.safety_review_notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <InfoList title="Key Findings" items={selected.key_findings} />
                <InfoList title="Food Guidance" items={selected.food_guidance} />
                <InfoList
                  title="Lifestyle Guidance"
                  items={selected.lifestyle_guidance}
                />
                <InfoList
                  title="Doctor Prompts"
                  icon={<Stethoscope className="h-4 w-4 text-claro-blue" />}
                  items={selected.doctor_prompts}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-claro-ink">
                  Biomarkers
                </h3>
                <div className="mt-4 space-y-3">
                  {selected.biomarkers.map((marker) => {
                    const isExpanded = expandedMarker === marker.id;
                    return (
                      <article
                        className="rounded-md border border-slate-200 p-4"
                        key={marker.id}
                      >
                        <button
                          className="flex w-full items-start justify-between gap-4 text-left"
                          type="button"
                          onClick={() =>
                            setExpandedMarker(isExpanded ? null : marker.id)
                          }
                        >
                          <span>
                            <span className="block font-semibold text-claro-ink">
                              {marker.name}
                            </span>
                            <span className="mt-1 block text-sm text-slate-600">
                              {marker.value} {marker.unit} - range{" "}
                              {marker.normal_range}
                            </span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                              {marker.status}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          </span>
                        </button>
                        {isExpanded ? (
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <p className="text-sm leading-6 text-slate-700">
                              {marker.summary}
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {Object.entries(marker.explanations).map(
                                ([level, text]) => (
                                  <div
                                    className="rounded-md bg-slate-50 p-3"
                                    key={level}
                                  >
                                    <p className="text-xs font-semibold uppercase text-slate-500">
                                      {explanationLabels[level] ?? level}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                      {text}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>

              <p className="mt-6 rounded-md bg-slate-100 p-4 text-sm leading-6 text-slate-600">
                {selected.disclaimer}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoList({
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
