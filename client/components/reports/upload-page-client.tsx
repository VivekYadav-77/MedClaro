"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, CheckCircle2, FileText, Loader2, Pill, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrescriptionCandidateReport, PrescriptionContextualAnalysis, Report } from "@/lib/types";

export function UploadPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const isPrescription = type === "prescription";
  const [contextReport, setContextReport] = useState<Report | null>(null);

  function handleUploaded(report: Report) {
    if (isPrescription) {
      setContextReport(report);
      return;
    }
    if (next === "refills" || next === "generics") {
      router.push(`/reports/medications${next === "refills" ? "?tab=refills" : next === "generics" ? "?tab=generics" : ""}`);
      return;
    }
    router.push(`/reports/${report._id}`);
  }

  function openPrescriptionContext(report: Report) {
    setContextReport(report);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          {isPrescription ? "Rx Context Analysis" : "Upload Report"}
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          {isPrescription ? "Upload prescription, select saved reports, run context analysis" : "Add a blood report, prescription, or scan"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          {isPrescription
            ? "The prescription is extracted first. Then choose from saved analyzed reports ranked by relevance, or continue with prescription-only analysis at lower confidence."
            : "Files are validated for MIME type, limited to 10 MB, and analyzed through the connected report API when available."}
        </p>
      </div>

      {isPrescription ? (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 shadow-none">
          <Pill className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-950">Prescription context</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              After upload, you will review saved analyzed reports. If none are available, you can continue with a lower-confidence prescription-only explanation.
            </p>
          </div>
        </Card>
      ) : null}

      <InlineUploader
        onUploaded={handleUploaded}
        onViewReport={(report) => (isPrescription ? openPrescriptionContext(report) : router.push(`/reports/${report._id}`))}
        eyebrow={isPrescription ? "Prescription upload" : "Inline Upload"}
        title={isPrescription ? "Upload prescription for extraction" : "Analyze a report from the dashboard"}
        dropTitle={isPrescription ? "Drop your prescription here" : "Drop your report here"}
        actionLabel={isPrescription ? "Extract prescription" : "Analyze report"}
        processingLabel={isPrescription ? "Extracting prescription..." : "Processing..."}
        doneLabel={isPrescription ? "Next: choose reports" : "View Current Analysis"}
        progressSteps={
          isPrescription
            ? ["Uploading", "Extracting prescription text", "Saving prescription context", "Ready for report selection"]
            : undefined
        }
        progressDoneText={isPrescription ? "Prescription extracted" : undefined}
        autoAdvance={!isPrescription}
        uploadKind={isPrescription ? "prescription" : "report"}
      />

      {contextReport ? (
        <PrescriptionContextModal
          report={contextReport}
          accessToken={session?.accessToken}
          onClose={() => setContextReport(null)}
          onDone={() => router.push("/reports/medications")}
        />
      ) : null}
    </div>
  );
}

function PrescriptionContextModal({
  report,
  accessToken,
  onClose,
  onDone,
}: {
  report: Report;
  accessToken?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [prescriptionId, setPrescriptionId] = useState(report.prescriptionRecordId ?? "");
  const [candidates, setCandidates] = useState<PrescriptionCandidateReport[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PrescriptionContextualAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      if (!process.env.NEXT_PUBLIC_API_URL || !accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        };
        let id = report.prescriptionRecordId;
        if (!id) {
          const recordResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/from-report`, {
            method: "POST",
            headers,
            body: JSON.stringify({ reportId: report._id }),
          });
          const recordPayload = await recordResponse.json().catch(() => null);
          if (!recordResponse.ok) {
            throw new Error(recordPayload?.error || "Could not prepare prescription context.");
          }
          id = recordPayload.id;
        }
        setPrescriptionId(id ?? "");
        const candidateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${id}/candidate-reports`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const payload = await candidateResponse.json().catch(() => null);
        const loaded: PrescriptionCandidateReport[] = candidateResponse.ok ? payload?.candidateReports ?? [] : [];
        setCandidates(loaded);
        setSelectedIds(loaded.filter((item) => item.relevanceScore >= 60).map((item) => item.reportId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load related reports.");
      } finally {
        setLoading(false);
      }
    }

    void loadCandidates();
  }, [accessToken, report._id, report.prescriptionRecordId]);

  function toggleReport(reportId: string) {
    setSelectedIds((current) => (current.includes(reportId) ? current.filter((id) => id !== reportId) : [...current, reportId]));
  }

  async function runAnalysis(mode: "with_reports" | "prescription_only") {
    if (!process.env.NEXT_PUBLIC_API_URL || !accessToken || !prescriptionId) return;
    setAnalyzing(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${prescriptionId}/contextual-analysis`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          reportIds: mode === "with_reports" ? selectedIds : [],
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not run prescription analysis.");
      }
      setAnalysis(payload.analysis ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run prescription analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  const result = analysis?.result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Prescription context</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
              {analysis ? "Prescription analysis" : "Select related analyzed reports"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {analysis
                ? analysis.selectedReportIds.length
                  ? "Report-enhanced analysis used the prescription and selected saved reports."
                  : "Prescription-only analysis used the prescription details without report context."
                : "Pick saved analyzed reports that relate to this prescription, or analyze the prescription alone at lower confidence."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error ? <Card className="border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</Card> : null}

          {loading ? (
            <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding related analyzed reports
            </Card>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {analysis.selectedReportIds.length ? "Report-enhanced analysis" : "Prescription-only analysis"}
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">{result?.likelyTreating || "Prescription explanation generated"}</p>
                  <p className="mt-1 text-sm text-slate-600">{result?.confidenceReason}</p>
                </div>
                <Badge variant={analysis.confidence === "high" ? "success" : analysis.confidence === "medium" ? "warning" : "default"}>
                  {analysis.confidence} confidence
                </Badge>
              </div>

              {result?.medicineExplanations?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {result.medicineExplanations.map((item) => (
                    <Card key={item.medicineName} className="p-3 shadow-none">
                      <p className="font-semibold text-slate-950">{item.medicineName}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.patientExplanation || item.purpose || "Purpose not confirmed."}</p>
                    </Card>
                  ))}
                </div>
              ) : null}

              {result?.reportConnections?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Report connections</p>
                  {result.reportConnections.map((item) => (
                    <p key={item} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{item}</p>
                  ))}
                </div>
              ) : null}

              {result?.abnormalIndicatorsConnectedToMedicines?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Connected indicators</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {result.abnormalIndicatorsConnectedToMedicines.map((item) => (
                      <div key={`${item.marker}-${item.value}`} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                        <p className="font-semibold">{item.marker}: {item.value}</p>
                        <p className="mt-1">{item.medicineConnection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {result?.disclaimer ? <p className="text-xs leading-5 text-slate-500">{result.disclaimer}</p> : null}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={onDone}>Go to medication center</Button>
              </div>
            </div>
          ) : candidates.length ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {candidates.map((candidate) => {
                  const selected = selectedIds.includes(candidate.reportId);
                  return (
                    <button
                      key={candidate.reportId}
                      type="button"
                      onClick={() => toggleReport(candidate.reportId)}
                      className={`rounded-lg border bg-white p-4 text-left transition ${
                        selected ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{candidate.labName || candidate.reportType}</p>
                          <p className="mt-1 text-sm text-slate-500">{String(candidate.reportDate || candidate.uploadDate).slice(0, 10)}</p>
                        </div>
                        <Badge variant={selected ? "success" : candidate.relevanceScore >= 60 ? "warning" : "default"}>
                          {selected ? "Selected" : `${candidate.relevanceScore}% match`}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{candidate.analysisSummary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={candidate.abnormalCount ? "warning" : "default"}>
                          {candidate.abnormalCount ? `${candidate.abnormalCount} flags` : "No flags"}
                        </Badge>
                        {candidate.relevanceReasons.slice(0, 2).map((reason) => (
                          <Badge key={reason}>{reason}</Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" onClick={() => runAnalysis("prescription_only")} disabled={analyzing}>
                  Analyze prescription only
                </Button>
                <Button onClick={() => runAnalysis("with_reports")} disabled={analyzing || selectedIds.length === 0} className="gap-2">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  Analyze with selected reports
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-dashed p-8 text-center shadow-none">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-900">No analyzed reports found</p>
              <p className="mt-1 text-sm text-slate-500">You can still analyze the prescription alone, but confidence will be lower.</p>
              <Button onClick={() => runAnalysis("prescription_only")} disabled={analyzing} className="mt-4 gap-2">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Continue prescription-only
              </Button>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
