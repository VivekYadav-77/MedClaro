"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock3, FileText, Loader2, Pill, RefreshCw, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrescriptionAnalysisHistoryItem, PrescriptionRecord, Report } from "@/lib/types";

type MedicationContext = {
  prescription: Report;
  prescriptionRecord: PrescriptionRecord;
  relatedReports: Report[];
  message: string;
};

type RefillPrompt = {
  reportId: string;
  medications: string[];
  daysSinceUpload: number;
  risk: "normal" | "watch" | "high";
  message: string;
};

type RiskResult = {
  summary?: string;
  riskLevel?: "low" | "moderate" | "high";
  conflicts?: { title?: string; severity?: string; explanation?: string; recommendation?: string }[];
  cautions?: string[];
  dataUsed?: {
    prescriptionId: string;
    prescriptionReportId: string;
    linkedReportIds: string[];
    comparisonPrescriptionIds: string[];
    comparisonPrescriptionReportIds: string[];
    prescriptionOnly: boolean;
  };
};

export function MedicationsClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [contexts, setContexts] = useState<MedicationContext[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [analyses, setAnalyses] = useState<PrescriptionAnalysisHistoryItem[]>([]);
  const [refills, setRefills] = useState<RefillPrompt[]>([]);
  const [riskResults] = useState<Record<string, RiskResult>>({});
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get("tab") ?? "overview";

  async function load() {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [contextResponse, prescriptionResponse, analysisResponse, adherenceResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/medication-context`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescription-analyses`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/adherence`, { headers, cache: "no-store" }),
      ]);
      const contextPayload = await contextResponse.json().catch(() => null);
      const prescriptionPayload = await prescriptionResponse.json().catch(() => null);
      const analysisPayload = await analysisResponse.json().catch(() => null);
      const adherencePayload = await adherenceResponse.json().catch(() => null);
      setContexts(contextResponse.ok ? contextPayload.contexts ?? [] : []);
      setPrescriptions(prescriptionResponse.ok ? prescriptionPayload.prescriptions ?? [] : []);
      setAnalyses(analysisResponse.ok ? analysisPayload.analyses ?? [] : []);
      setRefills(adherenceResponse.ok ? adherencePayload.prompts ?? [] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [session?.accessToken]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Medication Center</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Prescription-specific medication risk</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Keep every prescription as its own record, connect it to selected reports, and compare it with medicines currently marked ongoing.
          </p>
        </div>
        <Link href="/reports/medications/intake">
          <Button className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Start guided review
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabLink href="/reports/medications" label="Overview" active={activeTab === "overview"} />
        <TabLink href="/reports/medications?tab=refills" label="Refills" active={activeTab === "refills"} />
        <TabLink href="/reports/medications?tab=generics" label="Generics" active={activeTab === "generics"} />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading medication context
        </Card>
      ) : null}

      {activeTab === "refills" ? (
        <RefillPanel prompts={refills} prescriptions={prescriptions} />
      ) : activeTab === "generics" ? (
        <GenericPanel contexts={contexts} />
      ) : (
        <OverviewPanel contexts={contexts} prescriptions={prescriptions} analyses={analyses} riskResults={riskResults} />
      )}
    </div>
  );
}

function OverviewPanel({
  contexts,
  prescriptions,
  analyses,
  riskResults,
}: {
  contexts: MedicationContext[];
  prescriptions: PrescriptionRecord[];
  analyses: PrescriptionAnalysisHistoryItem[];
  riskResults: Record<string, RiskResult>;
}) {
  const ongoingCount = prescriptions.filter((record) => record.status === "ongoing").length;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Prescription records" value={prescriptions.length} />
        <SummaryTile label="Ongoing prescriptions" value={ongoingCount} />
        <SummaryTile label="Linked analyzed reports" value={prescriptions.reduce((total, record) => total + record.linkedReports.length, 0)} />
      </div>

      {prescriptions.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {prescriptions.map((record) => {
            const result = riskResults[record.id];
            return (
              <Card key={record.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                      <Pill className="h-4 w-4 text-brand-600" />
                      {record.report.labName || "Prescription"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {record.medications.length} medicine(s) extracted - {record.linkedReports.length} report(s) selected
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusBadge(record.status)}>{statusLabel(record.status)}</Badge>
                    {record.latestAnalysis ? <Badge variant="brand">Analyzed</Badge> : <Badge variant="warning">Needs analysis</Badge>}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {record.medications.slice(0, 4).map((medication) => (
                    <div key={`${record.id}-${medication.name}-${medication.dosage}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{medication.name || "Medicine"}</p>
                      <p className="text-sm text-slate-500">
                        {medication.dosage || "Dose not extracted"} {medication.frequency || ""}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">Risk context</p>
                  {record.linkedReports.length ? (
                    <div className="mt-2 space-y-2">
                      {record.linkedReports.map((report) => (
                        <Link key={report._id} href={`/reports/${report._id}`} className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800">
                          <FileText className="h-4 w-4" />
                          {report.labName || report.reportType}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-amber-700">No blood report selected yet. Add context before trusting a medication-risk result.</p>
                  )}
                </div>

                {result ? <RiskResultPanel result={result} /> : null}
                {!result && record.latestAnalysis ? <SavedAnalysisPanel analysis={record.latestAnalysis} /> : null}

                <div className="flex flex-wrap gap-2">
                  <Link href={`/reports/medications/intake?prescriptionId=${record.id}`}>
                    <Button className="gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Run analysis
                    </Button>
                  </Link>
                  <Link href={`/reports/medications/${record.id}`}>
                    <Button variant="outline">Review</Button>
                  </Link>
                  <Link href={`/reports/medications/setup?prescriptionReportId=${record.reportId}&prescriptionId=${record.id}`}>
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Edit context
                    </Button>
                  </Link>
                  <Link href={`/reports/${record.reportId}?tab=meds`}>
                    <Button variant="ghost">Open prescription</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyMedicationState />
      )}

      {!prescriptions.length && contexts.length ? (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Older prescription context exists, but records are not fully set up yet. Reopen each prescription from report history to complete setup.
        </Card>
      ) : null}

      <AllPrescriptionAnalyses analyses={analyses} />
    </div>
  );
}

function RiskResultPanel({ result }: { result: RiskResult }) {
  const conflicts = result.conflicts ?? [];
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Focused medication review</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{result.summary || "Review generated from this prescription, selected reports, and ongoing prescriptions."}</p>
        </div>
        {result.riskLevel ? <Badge variant={result.riskLevel === "high" ? "danger" : result.riskLevel === "moderate" ? "warning" : "success"}>{result.riskLevel}</Badge> : null}
      </div>
      {conflicts.length ? (
        <div className="mt-3 space-y-2">
          {conflicts.slice(0, 3).map((conflict, index) => (
            <div key={`${conflict.title}-${index}`} className="rounded-md bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{conflict.title || "Medication caution"}</p>
              <p className="mt-1 text-slate-600">{conflict.explanation || conflict.recommendation || "Discuss this item with a clinician."}</p>
            </div>
          ))}
        </div>
      ) : null}
      {result.dataUsed ? (
        <p className="mt-3 text-xs text-slate-500">
          Used {result.dataUsed.linkedReportIds.length} selected report(s) and {result.dataUsed.comparisonPrescriptionIds.length} other prescription(s).
        </p>
      ) : null}
    </div>
  );
}

function AllPrescriptionAnalyses({ analyses }: { analyses: PrescriptionAnalysisHistoryItem[] }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">All prescription analyses</h2>
          <p className="mt-1 text-sm text-slate-500">Saved medication-risk reviews across every analyzed prescription.</p>
        </div>
        <Link href="/reports/medications/intake">
          <Button variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            New analysis
          </Button>
        </Link>
      </div>

      {analyses.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {analyses.map((analysis) => {
            const medicines = analysis.prescription.medications.map((medication) => medication.name).filter(Boolean).slice(0, 3);
            return (
              <Card key={analysis.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{analysis.prescription.name || "Prescription"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {String(analysis.createdAt).slice(0, 10)}
                    </p>
                  </div>
                  {analysis.riskLevel ? (
                    <Badge variant={analysis.riskLevel === "high" ? "danger" : analysis.riskLevel === "moderate" ? "warning" : "success"}>{analysis.riskLevel}</Badge>
                  ) : (
                    <Badge variant="default">Saved</Badge>
                  )}
                </div>

                <p className="text-sm leading-6 text-slate-600">{analysis.summary || "Saved focused medication review."}</p>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <Badge variant="default">{analysis.relatedReportIds.length} linked report(s)</Badge>
                  <Badge variant="default">{analysis.comparisonPrescriptionIds.length} comparison prescription(s)</Badge>
                  {medicines.length ? <Badge variant="brand">{medicines.join(", ")}</Badge> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/reports/medications/${analysis.prescription.id}`}>
                    <Button variant="outline" size="sm">Open prescription</Button>
                  </Link>
                  <Link href={`/reports/medications/intake?prescriptionId=${analysis.prescription.id}`}>
                    <Button size="sm" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Rerun
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed p-5 text-sm text-slate-500">No saved prescription analyses yet.</Card>
      )}
    </section>
  );
}

function SavedAnalysisPanel({ analysis }: { analysis: NonNullable<PrescriptionRecord["latestAnalysis"]> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Last saved analysis</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{analysis.summary || "Saved focused review is available for this prescription."}</p>
        </div>
        {analysis.riskLevel ? <Badge variant={analysis.riskLevel === "high" ? "danger" : analysis.riskLevel === "moderate" ? "warning" : "success"}>{analysis.riskLevel}</Badge> : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">{String(analysis.createdAt).slice(0, 10)}</p>
    </div>
  );
}

function RefillPanel({ prompts, prescriptions }: { prompts: RefillPrompt[]; prescriptions: PrescriptionRecord[] }) {
  const ongoing = prescriptions.filter((record) => record.status === "ongoing");
  if (!prompts.length && !ongoing.length) return <EmptyMedicationState />;
  return (
    <div className="space-y-4">
      {ongoing.length ? (
        <Card className="p-4">
          <h2 className="font-semibold text-slate-950">Currently ongoing prescriptions</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {ongoing.map((record) => (
              <Link key={record.id} href={`/reports/medications/setup?prescriptionReportId=${record.reportId}&prescriptionId=${record.id}`} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">{record.report.labName || "Prescription"}</p>
                <p className="mt-1 text-sm text-slate-500">{record.medications.map((medication) => medication.name).filter(Boolean).slice(0, 3).join(", ") || "Medicines not extracted"}</p>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {prompts.map((prompt) => (
          <Card key={prompt.reportId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{prompt.medications.slice(0, 2).join(", ") || "Prescription refill"}</p>
              <Badge variant={prompt.risk === "high" ? "danger" : prompt.risk === "watch" ? "warning" : "success"}>{prompt.risk}</Badge>
            </div>
            <p className="text-sm leading-6 text-slate-600">{prompt.message}</p>
            <Link href={`/reports/${prompt.reportId}?tab=meds`}>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Open prescription
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GenericPanel({ contexts }: { contexts: MedicationContext[] }) {
  const meds = contexts.flatMap((context) => context.prescriptionRecord.medications ?? context.prescription.medications ?? []);
  return (
    <Card className="space-y-4 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 text-amber-700" />
        <div>
          <h2 className="font-semibold text-amber-950">Generic finder needs a trusted medicine database</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Detected {meds.length} prescription medicine(s). The app can show active molecules from parsed prescriptions, but price or brand substitution should stay pending until a reliable local database is connected.
          </p>
        </div>
      </div>
      {meds.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {meds.slice(0, 8).map((medication) => (
            <div key={`${medication.name}-${medication.dosage}`} className="rounded-lg bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{medication.name}</p>
              <p className="text-slate-500">{medication.purpose || "Purpose not extracted"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}

function EmptyMedicationState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Pill className="mx-auto h-9 w-9 text-slate-300" />
      <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">No prescriptions yet</h2>
      <p className="mt-1 text-sm text-slate-500">Upload a prescription, mark whether it is ongoing, and attach the reports it belongs to.</p>
      <Link href="/reports/medications/intake">
        <Button className="mt-5 gap-2">
          <ShieldCheck className="h-4 w-4" />
          Start guided review
        </Button>
      </Link>
    </div>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
        active ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

function statusLabel(status: PrescriptionRecord["status"]) {
  const labels: Record<PrescriptionRecord["status"], string> = {
    ongoing: "Ongoing",
    completed: "Completed",
    stopped: "Stopped",
    short_course: "Short course",
    unknown: "Needs setup",
  };
  return labels[status];
}

function statusBadge(status: PrescriptionRecord["status"]) {
  if (status === "ongoing") return "success";
  if (status === "short_course") return "warning";
  if (status === "completed") return "brand";
  if (status === "stopped") return "danger";
  return "default";
}
