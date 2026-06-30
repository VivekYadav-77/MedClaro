"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, FileText, Loader2, Pill, Save, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
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
    <div className="space-y-6 animate-fade-in pb-12">
      <Link href="/reports/medications" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to medication center
      </Link>

      <BentoCard className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-gradient-to-r from-brand-50 to-white border-brand-100/50">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Prescription setup</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-900 tracking-tight">Connect this prescription to the right reports</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 font-medium">
            Review the extracted prescription, select any related analyzed reports, then run the analysis. If no report is available, use prescription-only analysis with lower confidence.
          </p>
        </div>
        <Button onClick={() => save("with_reports")} disabled={!record || saving || selectedReportIds.length === 0} className="gap-2 rounded-xl px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Analyze with reports
        </Button>
      </BentoCard>

      {loading ? (
        <BentoCard className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500 min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="font-medium text-slate-600">Preparing prescription setup...</span>
        </BentoCard>
      ) : null}

      {error ? <BentoCard className="border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">{error}</BentoCard> : null}

      {record ? (
        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <BentoCard className="space-y-6 p-6 h-fit sticky top-6 bg-slate-50/50">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white shadow-sm border border-brand-100 p-3 text-brand-700">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-xl">{record.report.labName || "Prescription"}</h2>
                <p className="mt-1 text-sm text-slate-500 font-medium">{record.medications.length} extracted medicine(s)</p>
                {record.prescriptionContext?.diagnosis ? (
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis: {record.prescriptionContext.diagnosis}</p>
                ) : null}
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current status</span>
              <Select value={status} onChange={(event) => setStatus(event.target.value as PrescriptionStatus)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <span className="block text-[10px] text-slate-400 font-medium leading-relaxed">{statusOptions.find((option) => option.value === status)?.help}</span>
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Doctor name</span>
              <Input value={doctorName} onChange={(event) => setDoctorName(event.target.value)} placeholder="Optional" className="bg-white" />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Specialty</span>
              <Input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="Cardiology, diabetology..." className="bg-white" />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</span>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why it was prescribed, warnings, or follow-up advice." className="bg-white resize-none" rows={4} />
            </label>

            <Button onClick={() => save("prescription_only")} disabled={!record || saving} variant="outline" className="w-full gap-2 rounded-xl bg-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Continue prescription-only
            </Button>
          </BentoCard>

          <section className="space-y-6">
            <BentoCard className="p-5 bg-gradient-to-r from-brand-50 to-white border-brand-100/50">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-lg">Select related analyzed reports</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                    These saved reports are already analyzed and ranked by likely relevance to the prescription. Selected reports become the context for the prescription explanation.
                  </p>
                </div>
              </div>
            </BentoCard>

            {candidateReports.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {candidateReports.map((report) => {
                  const selected = selectedReportIds.includes(report.reportId);
                  return (
                    <button
                      key={report.reportId}
                      type="button"
                      onClick={() => toggleReport(report.reportId)}
                      className={`flex flex-col text-left transition-all duration-200 shadow-sm hover:shadow-md h-full rounded-2xl p-5 ${
                        selected ? "bg-white border-2 border-brand-400 ring-4 ring-brand-50" : "bg-white border border-slate-200 hover:border-brand-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div>
                          <p className="font-display font-bold text-slate-900 text-lg line-clamp-1">{report.labName || report.reportType}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{String(report.reportDate || report.uploadDate).slice(0, 10)}</p>
                        </div>
                        <Badge variant={selected ? "success" : report.relevanceScore >= 60 ? "warning" : "default"} className="rounded-md px-2.5 py-1 whitespace-nowrap">
                          {selected ? "Selected" : `${report.relevanceScore}% match`}
                        </Badge>
                      </div>
                      <p className="mt-4 flex-1 text-sm text-slate-600 font-medium leading-relaxed">{report.analysisSummary}</p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 w-full">
                        <Badge variant={report.abnormalCount ? "warning" : "outline"} className={report.abnormalCount ? "rounded-md" : "bg-slate-50 text-slate-500 border-slate-200 rounded-md"}>
                          {report.abnormalCount ? `${report.abnormalCount} flags` : "No flags"}
                        </Badge>
                        {report.relevanceReasons.slice(0, 2).map((reason) => (
                          <Badge key={reason} variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 rounded-md">{reason}</Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <BentoCard className="flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 border-slate-200 bg-slate-50/50 p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </span>
                <p className="font-display text-xl font-bold text-slate-900">No analyzed blood reports yet</p>
                <p className="mt-2 text-sm text-slate-500 max-w-sm font-medium leading-relaxed">Upload and analyze reports first for stronger context, or continue with lower-confidence prescription-only analysis.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/reports/upload">
                    <Button variant="outline" className="rounded-xl px-6 bg-white">Upload reports first</Button>
                  </Link>
                  <Button onClick={() => save("prescription_only")} disabled={saving} className="rounded-xl px-6">
                    Continue prescription-only
                  </Button>
                </div>
              </BentoCard>
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
    <BentoCard className="space-y-4 border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Safety review</p>
          <h2 className="mt-2 flex items-center gap-2 font-display font-bold text-slate-900 text-xl">
            <ShieldAlert className="h-5 w-5 text-brand-600" />
            Prescription risk check
          </h2>
        </div>
        <Badge variant={analysis.severity === "high" ? "danger" : analysis.severity === "watch" ? "warning" : "success"} className="rounded-md px-3 py-1">
          {analysis.severity === "none" ? "no risks found" : analysis.severity}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-slate-700 font-medium">{analysis.summary}</p>
      <div className="grid gap-3 pt-2">
        {analysis.findings.slice(0, 3).map((finding) => (
          <div key={`${finding.id}-${finding.title}`} className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
            <p className="text-sm font-bold text-slate-900">{finding.title}</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">{finding.nextStep}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400 font-medium pt-2">{analysis.disclaimer}</p>
    </BentoCard>
  );
}

function ContextualAnalysisResult({ analysis }: { analysis: PrescriptionContextualAnalysis }) {
  const result = analysis.result;
  return (
    <BentoCard className="space-y-6 border-brand-200 p-6 bg-gradient-to-br from-brand-50/50 to-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Contextual analysis</p>
          <h2 className="mt-2 font-display font-bold text-slate-900 text-xl">Prescription explanation with report context</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {analysis.selectedReportIds.length ? "Report-enhanced analysis" : "Prescription-only analysis"}
          </p>
        </div>
        <Badge variant={analysis.confidence === "high" ? "success" : analysis.confidence === "medium" ? "warning" : "default"} className="rounded-md px-3 py-1">
          {analysis.confidence} confidence
        </Badge>
      </div>

      <div className="space-y-3">
        {result.likelyTreating ? <p className="text-sm leading-relaxed text-slate-700 font-bold">{result.likelyTreating}</p> : null}
        {result.confidenceReason ? <p className="text-sm font-medium leading-relaxed text-slate-600">{result.confidenceReason}</p> : null}
      </div>

      {result.medicineExplanations?.length ? (
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {result.medicineExplanations.map((item) => (
            <div key={item.medicineName} className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm h-full flex flex-col justify-between">
              <p className="font-display font-bold text-slate-900 text-lg mb-2">{item.medicineName}</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.patientExplanation || item.purpose || "Purpose not confirmed."}</p>
            </div>
          ))}
        </div>
      ) : null}

      {result.reportConnections?.length ? (
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Report connections</p>
          <div className="space-y-3">
            {result.reportConnections.map((connection) => (
              <p key={connection} className="rounded-xl bg-slate-50/70 p-4 text-sm text-slate-700 font-medium leading-relaxed border border-slate-100">{connection}</p>
            ))}
          </div>
        </div>
      ) : null}

      {result.abnormalIndicatorsConnectedToMedicines?.length ? (
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Connected indicators</p>
          <div className="grid gap-3 md:grid-cols-2">
            {result.abnormalIndicatorsConnectedToMedicines.map((item) => (
              <div key={`${item.marker}-${item.value}`} className="rounded-xl bg-amber-50/50 p-4 text-sm text-amber-950 border border-amber-100 shadow-sm h-full flex flex-col justify-between">
                <p className="font-display font-bold text-amber-900 text-lg mb-2">{item.marker}: <span className="text-amber-700">{item.value}</span></p>
                <p className="text-amber-800/80 font-medium leading-relaxed">{item.medicineConnection}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.disclaimer ? <p className="text-[10px] leading-relaxed text-slate-400 font-medium pt-2 border-t border-slate-100">{result.disclaimer}</p> : null}
    </BentoCard>
  );
}
