"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, FileText, Loader2, Pill, Save, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PrescriptionCandidateReport,
  PrescriptionContextualAnalysis,
  PrescriptionRecord,
  PrescriptionRiskAnalysis,
  PrescriptionStatus,
} from "@/lib/types";

const statusOptions: { value: PrescriptionStatus; label: string; help: string }[] = [
  { value: "ongoing", label: "Ongoing now", help: "Use for current daily or active medicines." },
  { value: "short_course", label: "Short course", help: "Use for antibiotics, pain courses, or temporary medicines." },
  { value: "completed", label: "Completed", help: "Use when this prescription is finished." },
  { value: "stopped", label: "Stopped", help: "Use when a clinician stopped these medicines." },
  { value: "unknown", label: "Not sure", help: "Use when the timing is unclear." },
];

export function PrescriptionSetupClient() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const prescriptionReportId = searchParams.get("prescriptionReportId");
  const [record, setRecord] = useState<PrescriptionRecord | null>(null);
  const [candidateReports, setCandidateReports] = useState<PrescriptionCandidateReport[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PrescriptionContextualAnalysis | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<PrescriptionRiskAnalysis | null>(null);
  const [status, setStatus] = useState<PrescriptionStatus>("ongoing");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken || !prescriptionReportId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        };
        const recordResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/from-report`, {
          method: "POST",
          headers,
          body: JSON.stringify({ reportId: prescriptionReportId }),
        });
        const recordPayload = await recordResponse.json().catch(() => null);
        if (!recordResponse.ok) {
          throw new Error(recordPayload?.error || "Could not prepare this prescription.");
        }
        const loadedRecord = recordPayload as PrescriptionRecord;
        const candidatesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${loadedRecord.id}/candidate-reports`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: "no-store",
          },
        );
        const candidatesPayload = await candidatesResponse.json().catch(() => null);
        setRecord(loadedRecord);
        const loadedCandidates: PrescriptionCandidateReport[] = candidatesResponse.ok
          ? candidatesPayload?.candidateReports ?? []
          : [];
        setCandidateReports(loadedCandidates);
        setSelectedReportIds(
          loadedRecord.linkedReports.length
            ? loadedRecord.linkedReports.map((report) => report._id)
            : loadedCandidates.filter((candidate) => candidate.relevanceScore >= 60).map((candidate) => candidate.reportId),
        );
        setStatus(loadedRecord.status === "unknown" ? "ongoing" : loadedRecord.status);
        setDoctorName(loadedRecord.doctorName || "");
        setSpecialty(loadedRecord.specialty || "");
        setNotes(loadedRecord.notes || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not prepare this prescription.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [prescriptionReportId, session?.accessToken]);

  function toggleReport(reportId: string) {
    setSelectedReportIds((current) => (current.includes(reportId) ? current.filter((id) => id !== reportId) : [...current, reportId]));
  }

  async function save(mode: "with_reports" | "prescription_only" = "with_reports") {
    if (!record || !process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    setSaving(true);
    setError("");
    setAnalysis(null);
    setRiskAnalysis(null);
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };
      const detailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${record.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status, doctorName, specialty, notes }),
      });
      if (!detailResponse.ok) {
        throw new Error("Could not save prescription context.");
      }
      const analysisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${record.id}/contextual-analysis`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            mode,
            reportIds: mode === "prescription_only" ? [] : selectedReportIds,
          }),
        },
      );
      const analysisPayload = await analysisResponse.json().catch(() => null);
      if (!analysisResponse.ok) {
        throw new Error(analysisPayload?.error || "Could not run contextual analysis.");
      }
      setRecord(analysisPayload.prescription ?? record);
      setAnalysis(analysisPayload.analysis ?? null);
      const riskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/risk-analysis`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          familyMemberId: record.report.familyMemberId ?? null,
          prescriptionIds: [record.id],
          reportIds: mode === "prescription_only" ? [] : selectedReportIds,
        }),
      });
      if (riskResponse.ok) {
        setRiskAnalysis((await riskResponse.json()) as PrescriptionRiskAnalysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prescription context.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/reports/medications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to medication center
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Prescription setup</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Connect this prescription to the right reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review the extracted prescription, select any related analyzed reports, then run the analysis. If no report is available, use prescription-only analysis with lower confidence.
          </p>
        </div>
        <Button onClick={() => save("with_reports")} disabled={!record || saving || selectedReportIds.length === 0} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Analyze with reports
        </Button>
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing prescription setup
        </Card>
      ) : null}

      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</Card> : null}

      {record ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <Card className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">{record.report.labName || "Prescription"}</h2>
                <p className="mt-1 text-sm text-slate-500">{record.medications.length} extracted medicine(s)</p>
                {record.prescriptionContext?.diagnosis ? (
                  <p className="mt-1 text-xs text-slate-500">Diagnosis noted: {record.prescriptionContext.diagnosis}</p>
                ) : null}
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Current status</span>
              <Select value={status} onChange={(event) => setStatus(event.target.value as PrescriptionStatus)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <span className="block text-xs text-slate-500">{statusOptions.find((option) => option.value === status)?.help}</span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Doctor name</span>
              <Input value={doctorName} onChange={(event) => setDoctorName(event.target.value)} placeholder="Optional" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Specialty</span>
              <Input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="Cardiology, diabetology..." />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Notes</span>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why it was prescribed, warnings, or follow-up advice." />
            </label>

            <Button onClick={() => save("prescription_only")} disabled={!record || saving} variant="outline" className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Continue prescription-only
            </Button>
          </Card>

          <section className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h2 className="font-semibold text-slate-950">Select related analyzed reports</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    These saved reports are already analyzed and ranked by likely relevance to the prescription. Selected reports become the context for the prescription explanation.
                  </p>
                </div>
              </div>
            </Card>

            {candidateReports.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {candidateReports.map((report) => {
                  const selected = selectedReportIds.includes(report.reportId);
                  return (
                    <button
                      key={report.reportId}
                      type="button"
                      onClick={() => toggleReport(report.reportId)}
                      className={`rounded-lg border bg-white p-4 text-left transition ${
                        selected ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{report.labName || report.reportType}</p>
                          <p className="mt-1 text-sm text-slate-500">{String(report.reportDate || report.uploadDate).slice(0, 10)}</p>
                        </div>
                        <Badge variant={selected ? "success" : report.relevanceScore >= 60 ? "warning" : "default"}>
                          {selected ? "Selected" : `${report.relevanceScore}% match`}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{report.analysisSummary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={report.abnormalCount ? "warning" : "default"}>
                          {report.abnormalCount ? `${report.abnormalCount} flags` : "No flags"}
                        </Badge>
                        {report.relevanceReasons.slice(0, 2).map((reason) => (
                          <Badge key={reason} variant="default">{reason}</Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-900">No analyzed blood reports yet</p>
                <p className="mt-1 text-sm text-slate-500">Upload and analyze reports first for stronger context, or continue with lower-confidence prescription-only analysis.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href="/reports/upload">
                    <Button variant="outline">Upload reports first</Button>
                  </Link>
                  <Button onClick={() => save("prescription_only")} disabled={saving}>
                    Continue prescription-only
                  </Button>
                </div>
              </Card>
            )}

            {analysis ? <ContextualAnalysisResult analysis={analysis} /> : null}
            {riskAnalysis ? <CompactRiskSummary analysis={riskAnalysis} /> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function CompactRiskSummary({ analysis }: { analysis: PrescriptionRiskAnalysis }) {
  return (
    <Card className="space-y-3 border-slate-200 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Safety review</p>
          <h2 className="mt-1 flex items-center gap-2 font-semibold text-slate-950">
            <ShieldAlert className="h-4 w-4 text-brand-600" />
            Prescription risk check
          </h2>
        </div>
        <Badge variant={analysis.severity === "high" ? "danger" : analysis.severity === "watch" ? "warning" : "success"}>
          {analysis.severity === "none" ? "no risks found" : analysis.severity}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-slate-700">{analysis.summary}</p>
      {analysis.findings.slice(0, 3).map((finding) => (
        <div key={`${finding.id}-${finding.title}`} className="rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">{finding.title}</p>
          <p className="mt-1 text-sm text-slate-600">{finding.nextStep}</p>
        </div>
      ))}
      <p className="text-xs leading-5 text-slate-500">{analysis.disclaimer}</p>
    </Card>
  );
}

function ContextualAnalysisResult({ analysis }: { analysis: PrescriptionContextualAnalysis }) {
  const result = analysis.result;
  return (
    <Card className="space-y-4 border-brand-200 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Contextual analysis</p>
          <h2 className="mt-1 font-semibold text-slate-950">Prescription explanation with report context</h2>
          <p className="mt-1 text-sm text-slate-500">
            {analysis.selectedReportIds.length ? "Report-enhanced analysis" : "Prescription-only analysis"}
          </p>
        </div>
        <Badge variant={analysis.confidence === "high" ? "success" : analysis.confidence === "medium" ? "warning" : "default"}>
          {analysis.confidence} confidence
        </Badge>
      </div>

      {result.likelyTreating ? <p className="text-sm leading-6 text-slate-700">{result.likelyTreating}</p> : null}
      {result.confidenceReason ? <p className="text-sm font-medium text-slate-600">{result.confidenceReason}</p> : null}

      {result.medicineExplanations?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {result.medicineExplanations.map((item) => (
            <div key={item.medicineName} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold text-slate-950">{item.medicineName}</p>
              <p className="mt-1 text-sm text-slate-600">{item.patientExplanation || item.purpose || "Purpose not confirmed."}</p>
            </div>
          ))}
        </div>
      ) : null}

      {result.reportConnections?.length ? (
        <div>
          <p className="text-sm font-semibold text-slate-900">Report connections</p>
          <div className="mt-2 space-y-2">
            {result.reportConnections.map((connection) => (
              <p key={connection} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{connection}</p>
            ))}
          </div>
        </div>
      ) : null}

      {result.abnormalIndicatorsConnectedToMedicines?.length ? (
        <div>
          <p className="text-sm font-semibold text-slate-900">Connected indicators</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {result.abnormalIndicatorsConnectedToMedicines.map((item) => (
              <div key={`${item.marker}-${item.value}`} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">{item.marker}: {item.value}</p>
                <p className="mt-1">{item.medicineConnection}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.disclaimer ? <p className="text-xs leading-5 text-slate-500">{result.disclaimer}</p> : null}
    </Card>
  );
}
