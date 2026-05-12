"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FilePlus2, FileText, Loader2, Pill, ShieldCheck, Upload } from "lucide-react";
import { useSession } from "next-auth/react";

import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PrescriptionAnalysis, PrescriptionRecord, PrescriptionStatus, Report } from "@/lib/types";

type RiskResult = PrescriptionAnalysis["result"] & {
  analysis?: PrescriptionAnalysis;
  contextCaution?: string;
  dataUsed?: Record<string, unknown>;
};

type IntakeAnswer = "yes" | "no" | null;

export function MedicationIntakeClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(searchParams.get("prescriptionId") ?? "");
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(searchParams.get("selectedReportId") ? [searchParams.get("selectedReportId") as string] : []);
  const [ongoingAnswer, setOngoingAnswer] = useState<IntakeAnswer>(null);
  const [reportAnswer, setReportAnswer] = useState<IntakeAnswer>(searchParams.get("selectedReportId") ? "yes" : null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [uploadMode, setUploadMode] = useState<"prescription" | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState("");

  const selectedPrescription = prescriptions.find((record) => record.id === selectedPrescriptionId) ?? null;
  const ongoingPrescriptions = prescriptions.filter((record) => record.status === "ongoing" && record.id !== selectedPrescriptionId);
  const candidateReports = useMemo(
    () => reports.filter((report) => report.reportType !== "prescription" && report._id !== selectedPrescription?.reportId),
    [reports, selectedPrescription?.reportId],
  );

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${session.accessToken}` };
        const prescriptionReportId = searchParams.get("prescriptionReportId");
        if (prescriptionReportId) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/from-report`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ reportId: prescriptionReportId }),
          });
        }
        const [prescriptionResponse, reportsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions`, { headers, cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers, cache: "no-store" }),
        ]);
        const prescriptionPayload = await prescriptionResponse.json().catch(() => null);
        const reportsPayload = await reportsResponse.json().catch(() => []);
        const loadedPrescriptions = prescriptionResponse.ok ? prescriptionPayload.prescriptions ?? [] : [];
        setPrescriptions(loadedPrescriptions);
        setReports(Array.isArray(reportsPayload) ? reportsPayload : []);
        const queryPrescriptionId = searchParams.get("prescriptionId");
        const uploadedRecord = prescriptionReportId ? loadedPrescriptions.find((record: PrescriptionRecord) => record.reportId === prescriptionReportId) : null;
        const nextSelectedId = queryPrescriptionId || uploadedRecord?.id || loadedPrescriptions[0]?.id || "";
        setSelectedPrescriptionId(nextSelectedId);
        setOngoingAnswer(null);
        setReportAnswer(searchParams.get("selectedReportId") ? "yes" : null);
        if (searchParams.get("selectedReportId")) {
          setSelectedReportIds((current) => Array.from(new Set([...current, searchParams.get("selectedReportId") as string])));
          setStep(2);
        } else if (nextSelectedId) {
          setStep(prescriptionReportId ? 2 : 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load medication intake.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [session?.accessToken, searchParams]);

  function toggleComparison(id: string) {
    setSelectedComparisonIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleReport(id: string) {
    setSelectedReportIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function updateStatus(status: PrescriptionStatus) {
    if (!selectedPrescription || !process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${selectedPrescription.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPrescriptions((current) => current.map((record) => (record.id === selectedPrescription.id ? { ...record, status } : record)));
  }

  async function runAnalysis() {
    if (!selectedPrescription || !process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    setRunning(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${selectedPrescription.id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          relatedReportIds: selectedReportIds,
          comparisonPrescriptionIds: selectedComparisonIds,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not run medication risk analysis.");
      setResult(payload);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run medication risk analysis.");
    } finally {
      setRunning(false);
    }
  }

  function handlePrescriptionUploaded(report: Report) {
    setUploadMode(null);
    const params = new URLSearchParams({ prescriptionReportId: report._id });
    if (report.prescriptionRecordId) params.set("prescriptionId", report.prescriptionRecordId);
    router.push(`/reports/medications/intake?${params.toString()}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/reports/medications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to medication center
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Guided medication risk</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Choose prescription context before analysis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            The app will only analyze the prescription, ongoing prescriptions, and reports you confirm here.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadMode("prescription")}>
          <Upload className="h-4 w-4" />
          Upload prescription
        </Button>
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved prescriptions
        </Card>
      ) : null}

      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</Card> : null}

      {uploadMode === "prescription" ? (
        <InlineUploader
          onUploaded={handlePrescriptionUploaded}
          onViewReport={handlePrescriptionUploaded}
          eyebrow="Prescription upload"
          title="Upload and save this prescription"
          dropTitle="Drop your prescription here"
          emptyHint="PDF, JPG, or PNG prescription up to 10 MB"
          actionLabel="Save prescription"
          doneLabel="Continue medication review"
        />
      ) : null}

      {!loading && !prescriptions.length && uploadMode !== "prescription" ? (
        <Card className="space-y-4 border-dashed p-8 text-center">
          <Pill className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="font-display text-lg font-semibold text-slate-900">No saved prescriptions yet</h2>
          <p className="text-sm text-slate-500">Upload the prescription first. It will be saved, then this wizard will ask what it should be compared with.</p>
          <Button className="gap-2" onClick={() => setUploadMode("prescription")}>
            <Upload className="h-4 w-4" />
            Upload prescription
          </Button>
        </Card>
      ) : null}

      {prescriptions.length && uploadMode !== "prescription" ? (
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <StepRail step={step} />
          <section className="space-y-4">
            {step === 1 ? (
              <ChoosePrescriptionStep
                prescriptions={prescriptions}
                selectedId={selectedPrescriptionId}
                onSelect={(id) => {
                  setSelectedPrescriptionId(id);
                  setSelectedComparisonIds([]);
                  setSelectedReportIds([]);
                  setOngoingAnswer(null);
                  setReportAnswer(null);
                }}
                onNext={() => setStep(2)}
                onUploadPrescription={() => setUploadMode("prescription")}
              />
            ) : null}

            {step === 2 && selectedPrescription ? (
              <DecisionModal>
                <ContextStep
                  selectedPrescription={selectedPrescription}
                  ongoingPrescriptions={ongoingPrescriptions}
                  selectedComparisonIds={selectedComparisonIds}
                  answer={ongoingAnswer}
                  onToggleComparison={toggleComparison}
                  onAnswer={(answer) => {
                    setOngoingAnswer(answer);
                    setSelectedComparisonIds(answer === "yes" ? ongoingPrescriptions.map((record) => record.id) : []);
                  }}
                  onStatusChange={updateStatus}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  onUploadPrescription={() => setUploadMode("prescription")}
                />
              </DecisionModal>
            ) : null}

            {step === 3 && selectedPrescription ? (
              <DecisionModal>
                <ReportsStep
                  prescriptionId={selectedPrescription.id}
                  reports={candidateReports}
                  selectedReportIds={selectedReportIds}
                  answer={reportAnswer}
                  onAnswer={(answer) => {
                    setReportAnswer(answer);
                    if (answer === "no") setSelectedReportIds([]);
                  }}
                  onToggleReport={toggleReport}
                  onBack={() => setStep(2)}
                  onAnalyze={runAnalysis}
                  running={running}
                />
              </DecisionModal>
            ) : null}

            {step === 4 && selectedPrescription ? <ResultStep prescription={selectedPrescription} result={result} onReview={() => router.push("/reports/medications")} /> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DecisionModal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function StepRail({ step }: { step: number }) {
  const steps = ["Prescription", "Ongoing clash", "Connected report", "Analysis"];
  return (
    <Card className="h-fit p-3">
      {steps.map((label, index) => {
        const active = step === index + 1;
        const done = step > index + 1;
        return (
          <div key={label} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${active ? "bg-brand-50 text-brand-800" : "text-slate-500"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-100 text-emerald-700" : active ? "bg-brand-600 text-white" : "bg-slate-100"}`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            {label}
          </div>
        );
      })}
    </Card>
  );
}

function ChoosePrescriptionStep({
  prescriptions,
  selectedId,
  onSelect,
  onNext,
  onUploadPrescription,
}: {
  prescriptions: PrescriptionRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onUploadPrescription: () => void;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Which prescription should we analyze?</h2>
        <p className="mt-1 text-sm text-slate-600">Use a saved prescription, or upload a missing current prescription before analysis.</p>
      </div>
      <PrescriptionGroup title="Ongoing" records={prescriptions.filter((record) => record.status === "ongoing")} selectedId={selectedId} onSelect={onSelect} />
      <PrescriptionGroup title="Recent or needs setup" records={prescriptions.filter((record) => record.status === "unknown" || record.status === "short_course")} selectedId={selectedId} onSelect={onSelect} />
      <PrescriptionGroup title="Completed or stopped" records={prescriptions.filter((record) => record.status === "completed" || record.status === "stopped")} selectedId={selectedId} onSelect={onSelect} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onNext} disabled={!selectedId}>Continue</Button>
        <Button variant="outline" className="gap-2" onClick={onUploadPrescription}>
          <FilePlus2 className="h-4 w-4" />
          Upload missing prescription
        </Button>
      </div>
    </Card>
  );
}

function PrescriptionGroup({ title, records, selectedId, onSelect }: { title: string; records: PrescriptionRecord[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!records.length) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p>
      <div className="grid gap-2 md:grid-cols-2">
        {records.map((record) => (
          <button key={record.id} type="button" onClick={() => onSelect(record.id)} className={`rounded-lg border p-3 text-left ${selectedId === record.id ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{record.report.labName || "Prescription"}</p>
              <Badge variant={record.status === "ongoing" ? "success" : record.status === "unknown" ? "warning" : "default"}>{statusLabel(record.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{record.medications.map((medication) => medication.name).filter(Boolean).slice(0, 3).join(", ") || "Medicines not extracted"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContextStep({
  selectedPrescription,
  ongoingPrescriptions,
  selectedComparisonIds,
  answer,
  onToggleComparison,
  onAnswer,
  onStatusChange,
  onBack,
  onNext,
  onUploadPrescription,
}: {
  selectedPrescription: PrescriptionRecord;
  ongoingPrescriptions: PrescriptionRecord[];
  selectedComparisonIds: string[];
  answer: IntakeAnswer;
  onToggleComparison: (id: string) => void;
  onAnswer: (answer: "yes" | "no") => void;
  onStatusChange: (status: PrescriptionStatus) => void;
  onBack: () => void;
  onNext: () => void;
  onUploadPrescription: () => void;
}) {
  const canContinue = answer === "no" || (answer === "yes" && selectedComparisonIds.length > 0);
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Step 1: Is any saved prescription currently going on?</h2>
        <p className="mt-1 text-sm text-slate-600">
          If yes, select the ongoing prescription(s). The risk check will compare them against the prescription you are uploading or reviewing.
        </p>
      </div>
      <label className="block max-w-sm space-y-2">
        <span className="text-sm font-semibold text-slate-800">Status for selected prescription</span>
        <Select value={selectedPrescription.status} onChange={(event) => onStatusChange(event.target.value as PrescriptionStatus)}>
          <option value="ongoing">Ongoing now</option>
          <option value="short_course">Short course</option>
          <option value="completed">Completed</option>
          <option value="stopped">Stopped</option>
          <option value="unknown">Not sure</option>
        </Select>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onAnswer("yes")}
          disabled={!ongoingPrescriptions.length}
          className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            answer === "yes" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="font-semibold text-slate-900">Yes, compare with ongoing prescriptions</p>
          <p className="mt-1 text-sm text-slate-500">
            {ongoingPrescriptions.length ? `${ongoingPrescriptions.length} ongoing prescription(s) found.` : "No saved ongoing prescriptions found."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onAnswer("no")}
          className={`rounded-lg border p-4 text-left transition ${
            answer === "no" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="font-semibold text-slate-900">No, no saved ongoing prescription</p>
          <p className="mt-1 text-sm text-slate-500">Continue without prescription-to-prescription clash comparison.</p>
        </button>
      </div>
      {answer === "yes" && ongoingPrescriptions.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {ongoingPrescriptions.map((record) => (
            <button key={record.id} type="button" onClick={() => onToggleComparison(record.id)} className={`rounded-lg border p-3 text-left ${selectedComparisonIds.includes(record.id) ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white"}`}>
              <p className="font-semibold text-slate-900">{record.report.labName || "Ongoing prescription"}</p>
              <p className="mt-1 text-sm text-slate-500">{record.medications.map((medication) => medication.name).filter(Boolean).slice(0, 3).join(", ") || "Medicines not extracted"}</p>
            </button>
          ))}
        </div>
      ) : null}
      {answer === "yes" && !selectedComparisonIds.length ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Select at least one ongoing prescription, or choose No.</p>
      ) : null}
      {!ongoingPrescriptions.length ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No other ongoing prescriptions are saved yet.</p>
      ) : null}
      <Button variant="outline" className="w-fit gap-2" onClick={onUploadPrescription}>
        <Upload className="h-4 w-4" />
        Upload another current prescription
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canContinue}>Continue to Step 2</Button>
      </div>
    </Card>
  );
}

function ReportsStep({
  prescriptionId,
  reports,
  selectedReportIds,
  answer,
  onAnswer,
  onToggleReport,
  onBack,
  onAnalyze,
  running,
}: {
  prescriptionId: string;
  reports: Report[];
  selectedReportIds: string[];
  answer: IntakeAnswer;
  onAnswer: (answer: "yes" | "no") => void;
  onToggleReport: (id: string) => void;
  onBack: () => void;
  onAnalyze: () => void;
  running: boolean;
}) {
  const canAnalyze = answer === "no" || (answer === "yes" && selectedReportIds.length > 0);
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Step 2: Is any analyzed report connected with this prescription?</h2>
        <p className="mt-1 text-sm text-slate-600">
          If yes, select the report(s). If no, the app will analyze prescription clash risk without lab/report context.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onAnswer("yes")}
          disabled={!reports.length}
          className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            answer === "yes" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="font-semibold text-slate-900">Yes, connect analyzed report</p>
          <p className="mt-1 text-sm text-slate-500">
            {reports.length ? `${reports.length} analyzed report(s) available.` : "No analyzed reports found yet."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onAnswer("no")}
          className={`rounded-lg border p-4 text-left transition ${
            answer === "no" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="font-semibold text-slate-900">No, prescription only</p>
          <p className="mt-1 text-sm text-slate-500">Proceed without report context after this step.</p>
        </button>
      </div>
      {answer === "yes" && reports.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {reports.map((report) => {
            const abnormalCount = report.structuredData.filter((item) => item.flag !== "normal").length;
            return (
              <button key={report._id} type="button" onClick={() => onToggleReport(report._id)} className={`rounded-lg border p-3 text-left ${selectedReportIds.includes(report._id) ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900">{report.labName || report.reportType}</p>
                  <Badge variant={abnormalCount ? "warning" : "default"}>{abnormalCount ? `${abnormalCount} flags` : "No flags"}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{String(report.reportDate || report.uploadDate).slice(0, 10)}</p>
              </button>
            );
          })}
        </div>
      ) : null}
      {answer === "yes" && !selectedReportIds.length ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Select at least one connected analyzed report, or choose No.</p>
      ) : null}
      {!reports.length ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No analyzed blood reports are available yet.</p>
      ) : null}
      {answer === "no" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This analysis uses prescription data only; lab/report context was not included.
        </p>
      ) : null}
      <Link href={`/reports/upload?next=medication-intake-report&prescriptionId=${prescriptionId}`} className="inline-flex">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Upload missing related report
        </Button>
      </Link>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onAnalyze} disabled={running || !canAnalyze} className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Run focused analysis
        </Button>
      </div>
    </Card>
  );
}

function ResultStep({ prescription, result, onReview }: { prescription: PrescriptionRecord; result: RiskResult | null; onReview: () => void }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 text-brand-600" />
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">Analysis saved for {prescription.report.labName || "this prescription"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{result?.summary || "Focused medication analysis is complete. Review possible conflicts with a clinician."}</p>
        </div>
      </div>
      {result?.contextCaution ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{result.contextCaution}</p> : null}
      {result?.riskLevel ? <Badge variant={result.riskLevel === "high" ? "danger" : result.riskLevel === "moderate" ? "warning" : "success"}>{result.riskLevel}</Badge> : null}
      <Button onClick={onReview}>Review in medication center</Button>
    </Card>
  );
}

function statusLabel(status: PrescriptionStatus) {
  const labels: Record<PrescriptionStatus, string> = {
    ongoing: "Ongoing",
    completed: "Completed",
    stopped: "Stopped",
    short_course: "Short course",
    unknown: "Needs setup",
  };
  return labels[status];
}
