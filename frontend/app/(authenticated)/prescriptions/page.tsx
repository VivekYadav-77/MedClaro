"use client";

import { FormEvent, useState } from "react";
import {
  AlertTriangle,
  Bell,
  FileText,
  Loader2,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope
} from "lucide-react";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";

type MedicationWarning = {
  id: number;
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
  safety_review_required: boolean;
  safety_review_notes: string[];
  model_name: string;
  prompt_version: string;
  source_document_reference: string;
  medications: Medication[];
  medication_warnings: MedicationWarning[];
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

function severityClass(severity: string) {
  if (severity === "critical" || severity === "high") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (severity === "moderate") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function PrescriptionsPage() {
  const { token } = useSession();
  const [documentId, setDocumentId] = useState("");
  const [analyses, setAnalyses] = useState<PrescriptionAnalysis[]>([]);
  const [selected, setSelected] = useState<PrescriptionAnalysis | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

  async function loadAnalyses() {
    setStatus("loading");
    try {
      const data = await apiGet<PrescriptionAnalysis[]>("/prescriptions/analyses/", token);
      setAnalyses(data);
      setSelected(data[0] ?? null);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const analysis = await apiJson<PrescriptionAnalysis>("/prescriptions/analyses/", {
        method: "POST",
        token,
        body: { document_id: Number(documentId) }
      });
      setSelected(analysis);
      setAnalyses((current) => [
        analysis,
        ...current.filter((item) => item.id !== analysis.id)
      ]);
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
                Prescription Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Understand Medicines, Warnings, And Schedules
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Analyze prescription documents, extract medicines, plan reminders,
                and surface allergy, interaction, duplicate, food, alcohol, and
                driving safety prompts.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Stethoscope className="h-4 w-4 text-claro-blue" />
                Pharmacist review encouraged
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Medication guidance is educational and needs clinician confirmation.
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
              <FileText className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Analyze Prescription
              </h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Prescription document ID
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
                    <Pill className="h-4 w-4" />
                  )}
                  Analyze
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={loadAnalyses}
                >
                  <RefreshCw className="h-4 w-4" />
                  Load History
                </button>
              </div>
              {status === "error" ? (
                <p className="flex items-center gap-2 text-sm font-medium text-claro-rose">
                  <AlertTriangle className="h-4 w-4" />
                  Request failed. Check your session and prescription document ID.
                </p>
              ) : null}
            </div>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Prescription History
            </h2>
            <div className="mt-4 space-y-3">
              {analyses.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  No prescription analyses loaded yet.
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
                      {analysis.medications.length} medicines -{" "}
                      {analysis.medication_warnings.length} warnings
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
              <Pill className="h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Run or load a prescription analysis to view medicine guidance.
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
                <div className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <p>
                    Date: {selected.prescription_date ?? "Unknown"}
                  </p>
                  <p className="mt-1">
                    Expiry: {selected.expiry_date ?? "Unknown"}
                  </p>
                </div>
              </div>

              {selected.safety_review_required || selected.medication_warnings.length > 0 ? (
                <section className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <ShieldAlert className="h-4 w-4" />
                    Safety prompts
                  </div>
                  <div className="mt-3 space-y-3">
                    {selected.medication_warnings.map((warning) => (
                      <article
                        className="rounded-md bg-white p-3"
                        key={warning.id}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${severityClass(
                              warning.severity
                            )}`}
                          >
                            {warning.severity}
                          </span>
                          <h3 className="text-sm font-semibold text-claro-ink">
                            {warning.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {warning.message}
                        </p>
                        {warning.action_prompt ? (
                          <p className="mt-2 text-sm font-medium text-amber-800">
                            {warning.action_prompt}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-6 space-y-4">
                {selected.medications.map((medication) => (
                  <article
                    className="rounded-md border border-slate-200 p-4"
                    key={medication.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-claro-ink">
                          {medication.brand_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {medication.active_ingredient} {medication.strength}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                        <Bell className="h-4 w-4 text-claro-blue" />
                        {medication.schedules[0]?.reminder_status ?? "planned"}
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-slate-500">Purpose</dt>
                        <dd className="mt-1 leading-6 text-slate-700">
                          {medication.purpose}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Usage</dt>
                        <dd className="mt-1 leading-6 text-slate-700">
                          {medication.usage_guidance}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Schedule</dt>
                        <dd className="mt-1 leading-6 text-slate-700">
                          {medication.schedules[0]?.dosage} -{" "}
                          {medication.schedules[0]?.frequency}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Precautions</dt>
                        <dd className="mt-1 leading-6 text-slate-700">
                          {medication.alcohol_warning}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <ListBlock title="Side Effects" items={medication.side_effects} />
                      <ListBlock title="Food Notes" items={medication.food_warnings} />
                    </div>
                    <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      {medication.pregnancy_breastfeeding_note}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-md bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
