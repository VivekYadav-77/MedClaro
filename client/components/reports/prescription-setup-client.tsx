"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2, Pill, Save } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PrescriptionRecord, PrescriptionStatus, Report } from "@/lib/types";

const statusOptions: { value: PrescriptionStatus; label: string; help: string }[] = [
  { value: "ongoing", label: "Ongoing now", help: "Use for current daily or active medicines." },
  { value: "short_course", label: "Short course", help: "Use for antibiotics, pain courses, or temporary medicines." },
  { value: "completed", label: "Completed", help: "Use when this prescription is finished." },
  { value: "stopped", label: "Stopped", help: "Use when a clinician stopped these medicines." },
  { value: "unknown", label: "Not sure", help: "Use when the timing is unclear." },
];

export function PrescriptionSetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const prescriptionReportId = searchParams.get("prescriptionReportId");
  const [record, setRecord] = useState<PrescriptionRecord | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [status, setStatus] = useState<PrescriptionStatus>("ongoing");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const candidateReports = useMemo(
    () => reports.filter((report) => report._id !== record?.reportId && report.reportType !== "prescription"),
    [reports, record?.reportId],
  );

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
        const [recordResponse, reportsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/from-report`, {
            method: "POST",
            headers,
            body: JSON.stringify({ reportId: prescriptionReportId }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: "no-store",
          }),
        ]);
        const recordPayload = await recordResponse.json().catch(() => null);
        const reportsPayload = await reportsResponse.json().catch(() => []);
        if (!recordResponse.ok) {
          throw new Error(recordPayload?.error || "Could not prepare this prescription.");
        }
        const loadedRecord = recordPayload as PrescriptionRecord;
        setRecord(loadedRecord);
        setReports(Array.isArray(reportsPayload) ? reportsPayload : []);
        setSelectedReportIds(loadedRecord.linkedReports.map((report) => report._id));
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

  async function save() {
    if (!record || !process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    setSaving(true);
    setError("");
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };
      const [detailResponse, linksResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${record.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status, doctorName, specialty, notes }),
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${record.id}/links`, {
          method: "POST",
          headers,
          body: JSON.stringify({ reportIds: selectedReportIds }),
        }),
      ]);
      if (!detailResponse.ok || !linksResponse.ok) {
        throw new Error("Could not save prescription context.");
      }
      router.push("/reports/medications");
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
            Medication risk works best when each prescription has its own status and selected blood reports instead of scanning every old report.
          </p>
        </div>
        <Button onClick={save} disabled={!record || saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save context
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
          </Card>

          <section className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold text-slate-950">Select related analyzed reports</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Choose the latest or most relevant reports for this prescription. These selected reports become the risk-analysis context.
              </p>
            </Card>

            {candidateReports.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {candidateReports.map((report) => {
                  const selected = selectedReportIds.includes(report._id);
                  const abnormalCount = report.structuredData.filter((item) => item.flag !== "normal").length;
                  return (
                    <button
                      key={report._id}
                      type="button"
                      onClick={() => toggleReport(report._id)}
                      className={`rounded-lg border bg-white p-4 text-left transition ${
                        selected ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{report.labName || report.reportType}</p>
                          <p className="mt-1 text-sm text-slate-500">{String(report.reportDate || report.uploadDate).slice(0, 10)}</p>
                        </div>
                        <Badge variant={selected ? "success" : abnormalCount ? "warning" : "default"}>
                          {selected ? "Selected" : abnormalCount ? `${abnormalCount} flags` : "Normal"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-brand-700">
                        <FileText className="h-4 w-4" />
                        Open later from report history
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-900">No analyzed blood reports yet</p>
                <p className="mt-1 text-sm text-slate-500">Save this prescription now, then attach reports after uploading them.</p>
              </Card>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
