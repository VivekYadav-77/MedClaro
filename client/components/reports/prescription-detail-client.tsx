"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Pill,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrescriptionAnalysis, PrescriptionRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------
type SeverityLevel = "safe" | "low" | "moderate" | "high" | "critical";

function getSeverityConfig(level: SeverityLevel | string | undefined) {
  switch (level) {
    case "critical":
      return {
        bg: "bg-rose-950",
        border: "border-rose-800",
        text: "text-rose-50",
        icon: <XCircle className="h-6 w-6 text-rose-300" />,
        badge: "danger" as const,
        label: "Critical Risk",
        description: "One or more potentially dangerous combinations detected. Consult your doctor immediately.",
      };
    case "high":
      return {
        bg: "bg-rose-600",
        border: "border-rose-500",
        text: "text-white",
        icon: <TriangleAlert className="h-6 w-6 text-rose-100" />,
        badge: "danger" as const,
        label: "High Risk",
        description: "Significant medication concerns detected. Please discuss with your doctor before continuing.",
      };
    case "moderate":
      return {
        bg: "bg-amber-500",
        border: "border-amber-400",
        text: "text-white",
        icon: <AlertTriangle className="h-6 w-6 text-amber-100" />,
        badge: "warning" as const,
        label: "Moderate Risk",
        description: "Some caution is advised. Review these findings at your next doctor visit.",
      };
    case "low":
      return {
        bg: "bg-sky-600",
        border: "border-sky-500",
        text: "text-white",
        icon: <ShieldCheck className="h-6 w-6 text-sky-100" />,
        badge: "default" as const,
        label: "Low Risk",
        description: "Minor interactions detected. Keep your doctor informed.",
      };
    default: // safe
      return {
        bg: "bg-emerald-600",
        border: "border-emerald-500",
        text: "text-white",
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-100" />,
        badge: "success" as const,
        label: "No Conflicts Detected",
        description: "No significant medication conflicts were found based on available information.",
      };
  }
}

function severityBadgeVariant(severity: string) {
  if (severity === "critical" || severity === "high") return "danger" as const;
  if (severity === "moderate") return "warning" as const;
  return "default" as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PrescriptionDetailClient({ prescriptionId }: { prescriptionId: string }) {
  const { data: session } = useSession();
  const [prescription, setPrescription] = useState<PrescriptionRecord | null>(null);
  const [analyses, setAnalyses] = useState<PrescriptionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [prescriptionResponse, analysesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${prescriptionId}/analyses`, { headers, cache: "no-store" }),
      ]);
      const prescriptionPayload = await prescriptionResponse.json().catch(() => null);
      const analysesPayload = await analysesResponse.json().catch(() => null);
      const records = prescriptionResponse.ok ? prescriptionPayload.prescriptions ?? [] : [];
      setPrescription(records.find((record: PrescriptionRecord) => record.id === prescriptionId) ?? null);
      setAnalyses(analysesResponse.ok ? analysesPayload.analyses ?? [] : []);
      setLoading(false);
    }

    void load();
  }, [prescriptionId, session?.accessToken]);

  // Latest analysis with structured risks (from the new engine)
  const latestAnalysis = analyses[0] ?? null;
  const riskLevel = latestAnalysis?.result?.riskLevel ?? latestAnalysis?.riskLevel;
  const severityConfig = getSeverityConfig(riskLevel);
  const structuredRisks: {
    severity: string;
    risk_type: string;
    reason_code: string;
    affected_medicines: string[];
    reason: string;
    recommendation: string;
  }[] = (latestAnalysis?.result as { structuredRisks?: unknown[] })?.structuredRisks as typeof structuredRisks ?? [];
  const explanations: {
    severity: string;
    title: string;
    medicines: string[];
    patientExplanation: string;
    whatToDo: string;
  }[] = (latestAnalysis?.result as { explanations?: unknown[] })?.explanations as typeof explanations ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/reports/medications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to medication center
      </Link>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading prescription
        </Card>
      ) : null}

      {!loading && !prescription ? (
        <Card className="p-6 text-sm text-slate-600">Prescription not found.</Card>
      ) : null}

      {prescription ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Prescription review</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">
                {prescription.report.labName || "Saved prescription"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {prescription.medications.length} extracted medicine(s), {prescription.linkedReports.length} linked report(s)
              </p>
            </div>
            <Link href={`/reports/medications/intake?prescriptionId=${prescription.id}`}>
              <Button className="gap-2" id="btn-run-guided-analysis">
                <ShieldCheck className="h-4 w-4" />
                Run guided analysis
              </Button>
            </Link>
          </div>

          {/* ── Risk severity banner (only shown when there is an analysis) ── */}
          {latestAnalysis && (
            <div
              className={`rounded-xl border px-5 py-4 ${severityConfig.bg} ${severityConfig.border} ${severityConfig.text}`}
              role="status"
              id="risk-severity-banner"
            >
              <div className="flex items-start gap-3">
                {severityConfig.icon}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{severityConfig.label}</p>
                    <Badge variant={severityConfig.badge} className="opacity-90">
                      {riskLevel ?? "safe"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm opacity-90">{severityConfig.description}</p>
                  {latestAnalysis.result?.summary && (
                    <p className="mt-2 text-sm font-medium opacity-80">
                      {latestAnalysis.result.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-4">

              {/* ── AI-explained risk cards ── */}
              {explanations.length > 0 && (
                <Card className="space-y-4 p-5">
                  <h2 className="font-semibold text-slate-950">Detected medication risks</h2>
                  <div className="space-y-3">
                    {explanations.map((exp, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-4 ${
                          exp.severity === "critical" || exp.severity === "high"
                            ? "border-rose-200 bg-rose-50"
                            : exp.severity === "moderate"
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                        id={`risk-card-${i}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{exp.title}</p>
                          <Badge variant={severityBadgeVariant(exp.severity)}>{exp.severity}</Badge>
                        </div>
                        {exp.medicines?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {exp.medicines.map((med) => (
                              <span key={med} className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                                {med}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-3 text-sm text-slate-700">{exp.patientExplanation}</p>
                        {exp.whatToDo && (
                          <p className="mt-2 rounded-md bg-white/70 px-3 py-2 text-sm font-medium text-slate-800">
                            ✔ {exp.whatToDo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── General advice from AI ── */}
              {(latestAnalysis?.result as { generalAdvice?: string })?.generalAdvice && (
                <Card className="border-brand-100 bg-brand-50 p-4">
                  <p className="text-sm text-brand-900">
                    <strong>General advice: </strong>
                    {(latestAnalysis.result as { generalAdvice?: string }).generalAdvice}
                  </p>
                </Card>
              )}

              {/* ── Medicines card ── */}
              <Card className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                  <Pill className="h-4 w-4 text-brand-600" />
                  Medicines in this prescription
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {prescription.medications.map((medication) => (
                    <div key={`${medication.name}-${medication.dosage}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{medication.name || "Medicine"}</p>
                      <p className="text-sm text-slate-500">
                        {medication.dosage || "Dose not extracted"} {medication.frequency || ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{medication.purpose || "Purpose not extracted"}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* ── Analysis history (compact) ── */}
              <Card className="space-y-3 p-5">
                <h2 className="font-semibold text-slate-950">Saved analysis history</h2>
                {analyses.length ? (
                  analyses.map((analysis) => (
                    <div key={analysis.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-6 text-slate-700">
                          {analysis.summary || analysis.result?.summary || "Focused medication review saved."}
                        </p>
                        {analysis.riskLevel ? (
                          <Badge
                            variant={
                              analysis.riskLevel === "high" ? "danger" : analysis.riskLevel === "moderate" ? "warning" : "success"
                            }
                          >
                            {analysis.riskLevel}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {String(analysis.createdAt).slice(0, 10)} · {analysis.relatedReportIds.length} report(s) ·{" "}
                        {analysis.comparisonPrescriptionIds.length} comparison prescription(s)
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No saved analysis yet. Run guided analysis to create one.
                  </p>
                )}
              </Card>
            </section>

            {/* ── Aside ── */}
            <aside className="space-y-4">
              <Card className="p-4">
                <p className="text-sm font-semibold text-slate-900">Status</p>
                <Badge
                  className="mt-2"
                  variant={
                    prescription.status === "ongoing"
                      ? "success"
                      : prescription.status === "unknown"
                        ? "warning"
                        : "default"
                  }
                >
                  {prescription.status.replace("_", " ")}
                </Badge>
              </Card>

              {structuredRisks.length > 0 && (
                <Card className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-slate-900">Rule-engine findings</p>
                  <p className="text-xs text-slate-500">
                    {structuredRisks.length} risk(s) detected by the deterministic rule engine before AI explanation.
                  </p>
                  <div className="space-y-2">
                    {structuredRisks.map((risk, i) => (
                      <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                        <span className={`font-semibold ${risk.severity === "high" || risk.severity === "critical" ? "text-rose-700" : risk.severity === "moderate" ? "text-amber-700" : "text-slate-700"}`}>
                          [{risk.severity.toUpperCase()}]
                        </span>{" "}
                        {risk.reason_code} — {risk.affected_medicines.slice(0, 2).join(", ")}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="space-y-3 p-4">
                <p className="text-sm font-semibold text-slate-900">Linked reports</p>
                {prescription.linkedReports.length ? (
                  prescription.linkedReports.map((report) => (
                    <Link
                      key={report._id}
                      href={`/reports/${report._id}`}
                      className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800"
                    >
                      <FileText className="h-4 w-4" />
                      {report.labName || report.reportType}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No report context linked.</p>
                )}
              </Card>

              <Card className="border-amber-100 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">
                  <strong>Disclaimer:</strong> This analysis is generated from saved records using a rule engine and AI
                  explanation. It is not a substitute for professional medical advice. Always consult your doctor before
                  making changes to your medication.
                </p>
              </Card>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
