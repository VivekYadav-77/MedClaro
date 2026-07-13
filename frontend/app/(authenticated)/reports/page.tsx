"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BrainCircuit,
  ChevronDown,
  ClipboardList,
  FileText,
  HeartPulse,
  Loader2,
  Search,
  Stethoscope
} from "lucide-react";
import {
  FormField,
  InlineValidation,
  MetricTile,
  PageHeader,
  SafetyNotice,
  SectionHeader,
  SegmentedControl,
  StatusBadge,
  SuccessLine
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { apiGet, apiJson, documentsApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type VaultDocument = {
  id: number;
  title: string;
  document_type: string;
  status: string;
  source_date: string | null;
  created_at: string;
};

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
  sort_order: number;
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
  failure_reason: string;
  completed_at: string | null;
  created_at: string;
  biomarkers: Biomarker[];
};

const explanationLevels = [
  { value: "explain_to_grandma", label: "Grandma" },
  { value: "simple", label: "Simple" },
  { value: "detailed", label: "Detailed" },
  { value: "medical_student", label: "Medical Student" },
  { value: "doctor_mode", label: "Doctor Mode" }
];

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function ReportsPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [analyses, setAnalyses] = useState<ReportAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedMarker, setExpandedMarker] = useState<number | null>(null);
  const [markerQuery, setMarkerQuery] = useState("");
  const [markerFilter, setMarkerFilter] = useState("all");
  const [explanationLevel, setExplanationLevel] = useState("simple");
  const [status, setStatus] = useState<"idle" | "loading" | "analyzing" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => analyses.find((analysis) => analysis.id === selectedId) ?? analyses[0] ?? null,
    [analyses, selectedId]
  );

  const labReports = useMemo(
    () => documents.filter((document) => document.document_type === "lab_report"),
    [documents]
  );

  const filteredMarkers = useMemo(() => {
    const normalizedQuery = markerQuery.trim().toLowerCase();
    return (selected?.biomarkers ?? []).filter((marker) => {
      const matchesQuery =
        !normalizedQuery ||
        [marker.name, marker.code, marker.status, marker.summary]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesFilter =
        markerFilter === "all" ||
        (markerFilter === "abnormal" && marker.status !== "normal") ||
        (markerFilter === "critical" && (marker.status === "critical" || marker.severity >= 4)) ||
        marker.status === markerFilter;
      return matchesQuery && matchesFilter;
    });
  }, [markerFilter, markerQuery, selected]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function loadWorkspace() {
    setStatus("loading");
    setMessage("");
    try {
      const [documentData, analysisData] = await Promise.all([
        documentsApi.list<VaultDocument[]>(token),
        apiGet<ReportAnalysis[]>("/report-analyses/", token)
      ]);
      const queryDocumentId =
        typeof window === "undefined"
          ? ""
          : new URLSearchParams(window.location.search).get("document") ?? "";
      setDocuments(documentData);
      setAnalyses(analysisData);
      setSelectedId(analysisData[0]?.id ?? null);
      setExpandedMarker(analysisData[0]?.biomarkers[0]?.id ?? null);
      setDocumentId(
        (current) =>
          current ||
          queryDocumentId ||
          documentData.find((item) => item.document_type === "lab_report")?.id.toString() ||
          ""
      );
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Could not load reports. Check your session and try again.");
    }
  }

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentId) {
      setStatus("error");
      setMessage("Choose a lab report from your vault first.");
      return;
    }

    setStatus("analyzing");
    setMessage("Analyzing report and extracting biomarkers...");

    try {
      const analysis = await apiJson<ReportAnalysis>("/report-analyses/", {
        method: "POST",
        token,
        body: { document_id: Number(documentId) }
      });
      setSelectedId(analysis.id);
      setAnalyses((current) => [analysis, ...current.filter((item) => item.id !== analysis.id)]);
      setExpandedMarker(analysis.biomarkers[0]?.id ?? null);
      setStatus("saved");
      setMessage("Report analysis completed.");
    } catch {
      setStatus("error");
      setMessage("Analysis failed. Confirm this is a lab report document and try again.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading report intelligence" />
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
        eyebrow="AI Report Analysis"
        title="Understand Lab Reports Without Losing Clinical Context"
        description="Analyze vault documents, review severity-sorted findings, expand biomarkers, and switch explanation depth for different conversations."
        notice={
          <SafetyNotice>
            MedClaro explains findings and prepares doctor questions. It does not
            diagnose, prescribe, or replace qualified medical care.
          </SafetyNotice>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={runAnalysis}>
            <SectionHeader
              icon={ClipboardList}
              title="Analyze Vault Report"
              description="Choose a lab report that already exists in your Medical Vault."
            />
            <div className="mt-5 space-y-4">
              <FormField label="Lab report document">
                <select className={inputClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                  <option value="">Select a lab report</option>
                  {labReports.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
              </FormField>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70"
                type="submit"
                disabled={status === "analyzing"}
              >
                {status === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BrainCircuit className="h-4 w-4" aria-hidden />}
                {status === "analyzing" ? "Analyzing..." : "Run analysis"}
              </button>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                type="button"
                onClick={loadWorkspace}
              >
                Refresh results
              </button>
              {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}
              {status === "saved" ? <SuccessLine>{message}</SuccessLine> : null}
            </div>
          </form>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={FileText} title="Report History" description={`${analyses.length} analyses available`} />
            <div className="mt-4 space-y-3">
              {analyses.length === 0 ? (
                <EmptyState title="No analyses yet" message="Upload a lab report in the Medical Vault, then run analysis here." />
              ) : (
                analyses.map((analysis) => (
                  <button
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition",
                      selected?.id === analysis.id ? "border-claro-blue bg-blue-50" : "border-claro-border bg-white hover:bg-slate-50"
                    )}
                    key={analysis.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(analysis.id);
                      setExpandedMarker(analysis.biomarkers[0]?.id ?? null);
                    }}
                  >
                    <span className="block font-semibold text-claro-ink">{analysis.document_title}</span>
                    <span className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Score {analysis.health_score}</span>
                      <ReportStatusBadge status={analysis.health_status} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        {!selected ? (
          <EmptyState
            title="No report selected"
            message="Run or load an analysis to view health score, key findings, biomarkers, and doctor prompts."
          />
        ) : (
          <section className="space-y-6">
            <ReportSummaryHeader analysis={selected} />

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricTile icon={HeartPulse} label="Health score" value={selected.health_score} detail={selected.health_status.replaceAll("_", " ")} />
              <MetricTile icon={AlertTriangle} label="Findings" value={selected.key_findings.length} tone={selected.safety_review_required ? "attention" : "info"} />
              <MetricTile icon={BrainCircuit} label="Biomarkers" value={selected.biomarkers.length} tone="success" />
            </div>

            {selected.safety_review_required ? (
              <SafetyNotice title="Safety review applied" tone="attention">
                <ul className="space-y-1">
                  {selected.safety_review_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </SafetyNotice>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <InfoList title="Key Findings" items={selected.key_findings} />
              <InfoList title="Food Guidance" items={selected.food_guidance} />
              <InfoList title="Lifestyle Guidance" items={selected.lifestyle_guidance} />
              <InfoList title="Doctor Prompts" icon={<Stethoscope className="h-4 w-4 text-claro-blue" aria-hidden />} items={selected.doctor_prompts} />
            </div>

            <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <SectionHeader
                  icon={BrainCircuit}
                  title="Biomarker Explanations"
                  description="Search, filter abnormal values, and switch explanation depth."
                />
                <ExplanationLevelSwitcher value={explanationLevel} onChange={setExplanationLevel} />
              </div>

              <BiomarkerFilterBar
                filter={markerFilter}
                query={markerQuery}
                onFilterChange={setMarkerFilter}
                onQueryChange={setMarkerQuery}
              />

              <BiomarkerAccordion
                biomarkers={filteredMarkers}
                expandedId={expandedMarker}
                explanationLevel={explanationLevel}
                onToggle={(id) => setExpandedMarker(expandedMarker === id ? null : id)}
              />
            </section>

            <p className="rounded-md bg-claro-muted p-4 text-sm leading-6 text-slate-600">{selected.disclaimer}</p>
          </section>
        )}
      </div>
    </main>
  );
}

function ReportSummaryHeader({ analysis }: { analysis: ReportAnalysis }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{analysis.source_document_reference}</p>
          <h2 className="mt-1 text-2xl font-semibold text-claro-ink">{analysis.document_title}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Generated with {analysis.model_name} using {analysis.prompt_version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HealthScoreGauge score={analysis.health_score} />
          <ReportStatusBadge status={analysis.health_status} />
        </div>
      </div>
    </section>
  );
}

function HealthScoreGauge({ score }: { score: number }) {
  const stroke = 2 * Math.PI * 34;
  const offset = stroke - (Math.max(0, Math.min(score, 100)) / 100) * stroke;
  return (
    <div className="relative grid h-24 w-24 place-items-center" role="img" aria-label={`Health score ${score} out of 100`}>
      <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" fill="none" r="34" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="40" cy="40" fill="none" r="34" stroke="#2563eb" strokeDasharray={stroke} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="8" />
      </svg>
      <span className="text-xl font-semibold text-claro-ink">{score}</span>
    </div>
  );
}

function BiomarkerFilterBar({
  filter,
  query,
  onFilterChange,
  onQueryChange
}: {
  filter: string;
  query: string;
  onFilterChange: (value: string) => void;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
      <label className="relative block">
        <span className="sr-only">Search biomarkers</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input className={`${inputClass} pl-9`} placeholder="Search biomarkers" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </label>
      <select className={inputClass} value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Biomarker filter">
        <option value="all">All markers</option>
        <option value="abnormal">Abnormal</option>
        <option value="critical">Critical</option>
        <option value="normal">Normal</option>
        <option value="needs_attention">Needs attention</option>
      </select>
    </div>
  );
}

function BiomarkerAccordion({
  biomarkers,
  expandedId,
  explanationLevel,
  onToggle
}: {
  biomarkers: Biomarker[];
  expandedId: number | null;
  explanationLevel: string;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      {biomarkers.length === 0 ? (
        <EmptyState title="No matching biomarkers" message="Adjust search or filters to review extracted values." />
      ) : (
        biomarkers.map((marker) => {
          const isExpanded = expandedId === marker.id;
          return (
            <article className="rounded-md border border-claro-border" key={marker.id}>
              <button
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
                type="button"
                aria-expanded={isExpanded}
                onClick={() => onToggle(marker.id)}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-claro-ink">{marker.name}</span>
                    <BiomarkerStatusBadge status={marker.status} severity={marker.severity} />
                  </span>
                  <span className="mt-2 block text-sm text-slate-600">
                    {marker.value} {marker.unit} · reference {marker.normal_range}
                  </span>
                </span>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-500 transition", isExpanded && "rotate-180")} aria-hidden />
              </button>
              {isExpanded ? (
                <div className="border-t border-claro-border p-4">
                  <p className="text-sm leading-6 text-slate-700">{marker.summary}</p>
                  <div className="mt-4 rounded-md bg-claro-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {explanationLevels.find((level) => level.value === explanationLevel)?.label ?? "Explanation"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {marker.explanations[explanationLevel] ?? marker.explanations.simple ?? marker.summary}
                    </p>
                  </div>
                  {marker.recommendations.length ? (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                      {marker.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })
      )}
    </div>
  );
}

function ExplanationLevelSwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <SegmentedControl label="Explanation level" options={explanationLevels} value={value} onChange={onChange} />;
}

function InfoList({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-4 shadow-panel">
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

function ReportStatusBadge({ status }: { status: string }) {
  return <StatusBadge tone={statusTone(status)}>{status.replaceAll("_", " ")}</StatusBadge>;
}

function BiomarkerStatusBadge({ status, severity }: { status: string; severity: number }) {
  const tone = severity >= 4 || status === "critical" ? "critical" : statusTone(status);
  return <StatusBadge tone={tone}>{status.replaceAll("_", " ")}</StatusBadge>;
}

function statusTone(status: string): "neutral" | "info" | "success" | "attention" | "risk" | "critical" {
  if (status === "critical") return "critical";
  if (status === "needs_attention" || status === "borderline") return "attention";
  if (status === "worsening" || status === "high" || status === "low") return "risk";
  if (status === "normal" || status === "good" || status === "stable") return "success";
  return "neutral";
}
