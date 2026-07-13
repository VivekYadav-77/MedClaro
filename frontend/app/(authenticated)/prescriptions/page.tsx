"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Car,
  FileText,
  Loader2,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Utensils,
  Wine
} from "lucide-react";
import {
  FormField,
  InlineValidation,
  MetricTile,
  PageHeader,
  SafetyNotice,
  SectionHeader,
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
  source_date: string | null;
};

type MedicationWarning = {
  id: number;
  medication: number | null;
  medication_name: string | null;
  warning_type: string;
  severity: string;
  title: string;
  message: string;
  action_prompt: string;
};

type MedicationSchedule = {
  id: number;
  dosage: string;
  frequency: string;
  timing: string[];
  start_date: string | null;
  end_date: string | null;
  reminder_status: string;
  notification_plan: Record<string, unknown>;
  instructions: string;
};

type Medication = {
  id: number;
  brand_name: string;
  active_ingredient: string;
  strength: string;
  route: string;
  purpose: string;
  usage_guidance: string;
  side_effects: string[];
  food_warnings: string[];
  alcohol_warning: string;
  driving_warning: string;
  pregnancy_breastfeeding_note: string;
  schedules: MedicationSchedule[];
  warnings: MedicationWarning[];
};

type PrescriptionAnalysis = {
  id: number;
  document: number;
  document_title: string;
  status: string;
  prescribed_by: string;
  prescription_date: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  summary: string;
  warnings: string[];
  safety_review_required: boolean;
  safety_review_notes: string[];
  model_name: string;
  prompt_version: string;
  source_document_reference: string;
  failure_reason: string;
  medications: Medication[];
  medication_warnings: MedicationWarning[];
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function PrescriptionsPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [analyses, setAnalyses] = useState<PrescriptionAnalysis[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [warningFilter, setWarningFilter] = useState("all");
  const [status, setStatus] = useState<"idle" | "loading" | "analyzing" | "loaded" | "error">("loading");
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => analyses.find((analysis) => analysis.id === selectedId) ?? analyses[0] ?? null,
    [analyses, selectedId]
  );

  const prescriptionDocuments = useMemo(
    () => documents.filter((document) => document.document_type === "prescription"),
    [documents]
  );

  const rankedWarnings = useMemo(() => {
    const warnings = selected?.medication_warnings ?? medications.flatMap((medicine) => medicine.warnings);
    return warnings
      .filter((warning) => warningFilter === "all" || warning.severity === warningFilter)
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  }, [medications, selected, warningFilter]);

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
      const [documentData, analysisData, medicationData] = await Promise.all([
        documentsApi.list<VaultDocument[]>(token),
        apiGet<PrescriptionAnalysis[]>("/prescriptions/analyses/", token),
        apiGet<Medication[]>("/prescriptions/medications/", token)
      ]);
      setDocuments(documentData);
      setAnalyses(analysisData);
      setMedications(medicationData);
      setSelectedId(analysisData[0]?.id ?? null);
      setDocumentId((current) => current || documentData.find((item) => item.document_type === "prescription")?.id.toString() || "");
      setStatus("loaded");
    } catch {
      setStatus("error");
      setMessage("Could not load prescription workspace. Check your session and try again.");
    }
  }

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentId) {
      setStatus("error");
      setMessage("Choose a prescription document from your Medical Vault first.");
      return;
    }
    setStatus("analyzing");
    setMessage("Analyzing prescription and extracting medicine safety context...");
    try {
      const analysis = await apiJson<PrescriptionAnalysis>("/prescriptions/analyses/", {
        method: "POST",
        token,
        body: { document_id: Number(documentId) }
      });
      setSelectedId(analysis.id);
      setAnalyses((current) => [analysis, ...current.filter((item) => item.id !== analysis.id)]);
      setMedications((current) => [
        ...analysis.medications,
        ...current.filter((item) => !analysis.medications.some((next) => next.id === item.id))
      ]);
      setStatus("loaded");
      setMessage("Prescription analysis completed.");
    } catch {
      setStatus("error");
      setMessage("Analysis failed. Confirm this is a prescription document and try again.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading prescription workspace" />
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
        eyebrow="Prescription Intelligence"
        title="Medicines, Warnings, And Schedules"
        description="Separate prescription analyses from active medicines, ranked safety prompts, reminder schedules, and food/alcohol/driving guidance."
        actions={
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="button" onClick={loadWorkspace}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          <SafetyNotice title="Pharmacist review encouraged" tone={rankedWarnings.some((warning) => severityRank(warning.severity) >= 4) ? "risk" : "info"}>
            Medication guidance is educational. Confirm dosage, interactions, pregnancy guidance, and stopping/starting decisions with a qualified clinician or pharmacist.
          </SafetyNotice>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={runAnalysis}>
            <SectionHeader icon={FileText} title="Analyze Prescription" description="Choose a prescription document already stored in your Medical Vault." />
            <div className="mt-5 space-y-4">
              <FormField label="Prescription document">
                <select className={inputClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                  <option value="">Select prescription</option>
                  {prescriptionDocuments.map((document) => (
                    <option key={document.id} value={document.id}>{document.title}</option>
                  ))}
                </select>
              </FormField>
              <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={status === "analyzing"}>
                {status === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Pill className="h-4 w-4" aria-hidden />}
                {status === "analyzing" ? "Analyzing..." : "Run analysis"}
              </button>
              {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}
              {message && status === "loaded" ? <SuccessLine>{message}</SuccessLine> : null}
            </div>
          </form>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={FileText} title="Prescription Analyses" description={`${analyses.length} analyses loaded`} />
            <div className="mt-4 space-y-3">
              {analyses.length ? (
                analyses.map((analysis) => (
                  <button
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition",
                      selected?.id === analysis.id ? "border-claro-blue bg-blue-50" : "border-claro-border hover:bg-slate-50"
                    )}
                    key={analysis.id}
                    type="button"
                    onClick={() => setSelectedId(analysis.id)}
                  >
                    <span className="block font-semibold text-claro-ink">{analysis.document_title}</span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-600">
                      <span>{analysis.medications.length} medicines · {analysis.medication_warnings.length} warnings</span>
                      {analysis.is_expired ? <StatusBadge tone="attention">expired</StatusBadge> : null}
                    </span>
                  </button>
                ))
              ) : (
                <EmptyState title="No analyses yet" message="Upload a prescription to the vault, then analyze it here." />
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile icon={Pill} label="Active medicines" value={medications.length} />
            <MetricTile icon={ShieldAlert} label="Warnings" value={rankedWarnings.length} tone={rankedWarnings.length ? "attention" : "success"} />
            <MetricTile icon={Bell} label="Schedules" value={medications.reduce((total, item) => total + item.schedules.length, 0)} tone="info" />
          </div>

          <MedicationWarningPanel warnings={rankedWarnings} filter={warningFilter} onFilterChange={setWarningFilter} />

          {selected ? (
            <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
              <div className="flex flex-col gap-4 border-b border-claro-border pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{selected.source_document_reference}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-claro-ink">{selected.document_title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selected.summary}</p>
                </div>
                <div className="rounded-md border border-claro-border bg-claro-muted p-3 text-sm text-slate-700">
                  <p>Prescribed: {selected.prescription_date ? formatDate(selected.prescription_date) : "Unknown"}</p>
                  <p className="mt-1">Expiry: {selected.expiry_date ? formatDate(selected.expiry_date) : "Unknown"}</p>
                  <p className="mt-1">{selected.model_name} · {selected.prompt_version}</p>
                </div>
              </div>
              {selected.safety_review_required ? (
                <SafetyNotice title="Safety review applied" tone="attention">
                  {selected.safety_review_notes.join(" ")}
                </SafetyNotice>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={Pill} title="Active Medicines" description="Medicine cards show purpose, schedule, reminders, and safety notes without hiding warnings." />
            <div className="mt-5 space-y-4">
              {medications.length ? (
                medications.map((medication) => <MedicationCard key={medication.id} medication={medication} />)
              ) : (
                <EmptyState title="No active medicines loaded" message="Analyze a prescription to populate active medicines and reminder schedules." />
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function MedicationWarningPanel({
  filter,
  onFilterChange,
  warnings
}: {
  filter: string;
  onFilterChange: (value: string) => void;
  warnings: MedicationWarning[];
}) {
  const hasSevere = warnings.some((warning) => severityRank(warning.severity) >= 4);
  return (
    <section className={cn("rounded-md border p-5 shadow-panel", hasSevere ? "border-rose-200 bg-rose-50" : "border-claro-border bg-white")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader icon={AlertTriangle} title="Ranked Safety Warnings" description="Critical and high warnings stay prominent. Do not dismiss them without preserving history." />
        <select className={`${inputClass} md:w-44`} value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Warning severity filter">
          <option value="all">All warnings</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {warnings.length ? (
          warnings.map((warning) => (
            <article className="rounded-md border border-claro-border bg-white p-4" key={warning.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={severityTone(warning.severity)}>{warning.severity}</StatusBadge>
                <h3 className="font-semibold text-claro-ink">{warning.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{warning.message}</p>
              {warning.action_prompt ? <p className="mt-2 text-sm font-semibold text-claro-ink">{warning.action_prompt}</p> : null}
              {warning.medication_name ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{warning.medication_name} · {warning.warning_type.replaceAll("_", " ")}</p> : null}
            </article>
          ))
        ) : (
          <EmptyState title="No warnings in this filter" message="Warnings from prescription analysis will remain visible here." />
        )}
      </div>
    </section>
  );
}

function MedicationCard({ medication }: { medication: Medication }) {
  const schedule = medication.schedules[0];
  return (
    <article className="rounded-md border border-claro-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-claro-ink">{medication.brand_name}</h3>
          <p className="mt-1 text-sm text-slate-600">{medication.active_ingredient} {medication.strength} · {medication.route || "route not listed"}</p>
        </div>
        <StatusBadge tone={schedule?.reminder_status === "active" ? "success" : "info"}>
          {schedule?.reminder_status ?? "planned"}
        </StatusBadge>
      </div>

      <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        <Detail label="Purpose" value={medication.purpose} />
        <Detail label="Usage" value={medication.usage_guidance} />
        <Detail label="Schedule" value={schedule ? `${schedule.dosage} · ${schedule.frequency}` : "No schedule extracted"} />
        <Detail label="Timing" value={schedule?.timing.length ? schedule.timing.join(", ") : schedule?.instructions || "No timing extracted"} />
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SafetyList icon={Utensils} title="Food notes" items={medication.food_warnings} />
        <SafetyList icon={AlertTriangle} title="Side effects" items={medication.side_effects} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Caution icon={Wine} label="Alcohol" text={medication.alcohol_warning} />
        <Caution icon={Car} label="Driving" text={medication.driving_warning} />
        <Caution icon={Stethoscope} label="Pregnancy" text={medication.pregnancy_breastfeeding_note} />
      </div>

      {medication.warnings.length ? (
        <div className="mt-4 space-y-2">
          {medication.warnings.map((warning) => (
            <div className="rounded-md bg-claro-muted p-3 text-sm" key={warning.id}>
              <StatusBadge tone={severityTone(warning.severity)}>{warning.severity}</StatusBadge>
              <span className="ml-2 font-semibold text-claro-ink">{warning.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-700">{value || "Not listed"}</dd>
    </div>
  );
}

function SafetyList({ icon: Icon, title, items }: { icon: typeof AlertTriangle; title: string; items: string[] }) {
  return (
    <section className="rounded-md bg-claro-muted p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-claro-blue" aria-hidden />
        <h4 className="text-sm font-semibold text-claro-ink">{title}</h4>
      </div>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No notes extracted.</p>
      )}
    </section>
  );
}

function Caution({ icon: Icon, label, text }: { icon: typeof Wine; label: string; text: string }) {
  return (
    <div className="rounded-md border border-claro-border p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-claro-ink">
        <Icon className="h-4 w-4 text-claro-blue" aria-hidden />
        {label}
      </div>
      <p className="mt-2 leading-6 text-slate-600">{text || "No note extracted."}</p>
    </div>
  );
}

function severityRank(severity: string) {
  return { critical: 5, high: 4, moderate: 3, low: 2, info: 1 }[severity] ?? 0;
}

function severityTone(severity: string): "neutral" | "info" | "success" | "attention" | "risk" | "critical" {
  if (severity === "critical") return "critical";
  if (severity === "high") return "risk";
  if (severity === "moderate") return "attention";
  if (severity === "low" || severity === "info") return "info";
  return "neutral";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
