"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ClipboardCopy,
  FileDown,
  FileText,
  Leaf,
  MessageSquareText,
  Pill,
  ShieldCheck,
  Stethoscope,
  TableProperties,
  UsersRound,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/reports/chat-panel";
import { DietAdvicePanel } from "@/components/reports/diet-advice-panel";
import { LifestyleCorrelationCard } from "@/components/reports/lifestyle-correlation-card";
import { MedicationCard } from "@/components/reports/medication-card";
import { SummaryGenerator } from "@/components/reports/summary-generator";
import { VoiceReadout } from "@/components/reports/voice-readout";
import { Select } from "@/components/ui/select";
import { Circle, Report, ReportShare } from "@/lib/types";
import { loincHint, markerRisk } from "@/lib/clinical-features";
import { cn } from "@/lib/utils";

const tabs = ["Summary", "Values", "Doctor Export", "Meds", "Diet", "Chat", "Sharing"] as const;
type ReportTab = (typeof tabs)[number];

export function ReportDetailView({
  report,
  onClose
}: {
  report: Report | null;
  onClose: () => void;
}) {
  const [displayReport, setDisplayReport] = useState<Report | null>(report);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>("Summary");

  useEffect(() => {
    if (report) {
      setDisplayReport(report);
      setActiveTab("Summary");
      window.requestAnimationFrame(() => setOpen(true));
      return;
    }

    setOpen(false);
    const timer = window.setTimeout(() => setDisplayReport(null), 180);
    return () => window.clearTimeout(timer);
  }, [report]);

  const close = () => {
    setOpen(false);
    window.setTimeout(onClose, 180);
  };

  if (!displayReport) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className={`absolute inset-0 bg-slate-900/30 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={close}
        aria-label="Close report details"
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-dialog transition-transform duration-200 ease-out sm:rounded-l-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {displayReport.reportType.replace(/_/g, " ")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{displayReport.labName || "Health Report"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(displayReport.reportDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close report details">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  activeTab === tab ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:bg-white"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "Summary" ? (
            <div className="space-y-4">
          <section className="rounded-lg border border-brand-100 bg-brand-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Overall Summary</h3>
              </div>
              <Badge variant={attentionVariant(displayReport.aiExplanation.attentionScore)}>
                {displayReport.aiExplanation.attentionScore}/5 attention
              </Badge>
            </div>
            <p className="text-sm leading-7 text-slate-700">{displayReport.aiExplanation.holisticSummary}</p>
            <div className="mt-4">
              <VoiceReadout text={displayReport.aiExplanation.holisticSummary} language={displayReport.language} />
            </div>
          </section>

          {displayReport.aiExplanation.parameterLevel.length ? (
            <section className="space-y-3">
              <h3 className="font-semibold text-slate-900">Parameter Notes</h3>
              {displayReport.aiExplanation.parameterLevel.map((item) => (
                <div key={item.parameter} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-900">{item.parameter}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.explanation}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">{item.confidence}</p>
                </div>
              ))}
            </section>
          ) : null}

          <LifestyleCorrelationCard correlation={displayReport.aiExplanation.lifestyleCorrelation} />

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Confidence note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{displayReport.aiExplanation.confidenceNote}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Disclaimer</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{displayReport.aiExplanation.disclaimer}</p>
            </div>
          </section>
            </div>
          ) : null}

          {activeTab === "Values" ? <ParsedValuesTable report={displayReport} /> : null}
          {activeTab === "Doctor Export" ? (
            <div className="space-y-4">
              <EhrExportPanel report={displayReport} />
              <SummaryGenerator reportId={displayReport._id} />
            </div>
          ) : null}
          {activeTab === "Meds" ? <MedicationSafetyTab report={displayReport} /> : null}
          {activeTab === "Diet" ? <DietAdvicePanel reportId={displayReport._id} /> : null}
          {activeTab === "Chat" ? (
            <ChatPanel
              reportId={displayReport._id}
              language={displayReport.language}
              initialMessages={displayReport.chatHistory ?? []}
            />
          ) : null}
          {activeTab === "Sharing" ? <ReportSharingPanel report={displayReport} /> : null}
        </div>
      </aside>
    </div>
  );
}

function ParsedValuesTable({ report }: { report: Report }) {
  if (!report.structuredData.length) {
    return <EmptyClinicalPanel icon={TableProperties} title="No parsed values" body="This report does not contain structured lab values." />;
  }
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
        <FileText className="h-4 w-4 text-slate-500" />
        Parsed Values
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Parameter</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">Range</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.structuredData.map((item) => (
              <tr key={`${item.testName}-${item.unit}`} className="border-t border-slate-100">
                <td className="px-3 py-3 font-medium text-slate-900">{item.testName}</td>
                <td className="px-3 py-3 text-slate-700">{item.value} {item.unit}</td>
                <td className="px-3 py-3 text-slate-500">{formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}</td>
                <td className="px-3 py-3"><Badge variant={item.flag === "normal" ? "success" : "warning"}>{item.flag}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EhrExportPanel({ report }: { report: Report }) {
  if (!report.structuredData.length) {
    return <EmptyClinicalPanel icon={Stethoscope} title="EHR export needs lab values" body="Prescription-only and unstructured reports cannot generate a lab table yet." />;
  }
  const rows = report.structuredData.map((item) => ({ item, risk: markerRisk(item), loinc: loincHint(item.testName) }));
  const exportText = rows
    .map(({ item, risk, loinc }) => `${item.testName}\t${item.value} ${item.unit}\t${formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}\t${item.flag}\t${risk}\t${loinc}`)
    .join("\n");

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Stethoscope className="h-4 w-4 text-brand-600" />
            Doctor Export
          </h3>
          <p className="mt-1 text-sm text-slate-500">Tabular handoff with backend-compatible rows and local LOINC hints.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(exportText)}>
            <ClipboardCopy className="h-4 w-4" />
            Copy table
          </Button>
          <Button variant="soft" size="sm" onClick={() => window.print()}>
            <FileDown className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Marker</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">LOINC</th>
              <th className="px-3 py-2 text-left">Export</th>
              <th className="px-3 py-2 text-left">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, risk, loinc }) => (
              <tr key={`${item.testName}-${item.unit}`} className="border-t border-slate-100">
                <td className="px-3 py-3 font-medium text-slate-900">{item.testName}</td>
                <td className="px-3 py-3">{item.value} {item.unit}</td>
                <td className="px-3 py-3 text-slate-600">{loinc}</td>
                <td className="px-3 py-3 text-slate-500">Ready</td>
                <td className="px-3 py-3">
                  <Badge variant={risk === "high" ? "danger" : risk === "watch" ? "warning" : "success"}>{risk}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MedicationSafetyTab({ report }: { report: Report }) {
  const medicationCount = report.medications?.filter((medication) => medication.name).length ?? 0;
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ClinicalMiniStat label="Medicines" value={String(medicationCount)} />
        <ClinicalMiniStat label="Report type" value={report.reportType || "unknown"} />
      </div>
      {report.medications?.length ? (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Pill className="h-4 w-4 text-slate-500" />
            Prescription Details
          </h3>
          {report.medications.map((medication) => (
            <MedicationCard key={medication.name} medication={medication} />
          ))}
        </div>
      ) : (
        <EmptyClinicalPanel icon={Pill} title="No medicines extracted" body="Upload or open a prescription report to review extracted medicine details." />
      )}
      <GenericMedicinePanel hasMedication={Boolean(report.medications?.length)} />
    </section>
  );
}

function GenericMedicinePanel({ hasMedication }: { hasMedication: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">Generic medicine finder</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {hasMedication
          ? "Active molecules can be sent to `/medications/generic-options` once the lookup backend is available."
          : "No prescription medicines are available for comparison."}
      </p>
      <Button variant="outline" size="sm" className="mt-3" disabled>
        Needs backend
      </Button>
    </div>
  );
}

function ClinicalMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold capitalize text-slate-950">{value}</p>
    </div>
  );
}

function EmptyClinicalPanel({ icon: Icon, title, body }: { icon: typeof Pill; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function ReportSharingPanel({ report }: { report: Report }) {
  const { data: session } = useSession();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [circleId, setCircleId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = session?.accessToken;
  const isOwner = Boolean(report.userId && session?.user?.id === report.userId);
  const shareableCircles = circles.filter(
    (circle) => (circle.myRole === "admin" || circle.myRole === "caregiver") && !shares.some((share) => share.circleId === circle.id && share.status === "active")
  );

  useEffect(() => {
    if (!isOwner || !token || !process.env.NEXT_PUBLIC_API_URL) return;
    async function loadSharing() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [circleResponse, shareResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/circles`, { headers, cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/shares`, { headers, cache: "no-store" }),
        ]);
        setCircles(circleResponse.ok ? await circleResponse.json() : []);
        setShares(shareResponse.ok ? await shareResponse.json() : []);
      } finally {
        setLoading(false);
      }
    }
    void loadSharing();
  }, [isOwner, report._id, token]);

  if (!isOwner) return null;

  async function shareReport() {
    if (!circleId || !token || !process.env.NEXT_PUBLIC_API_URL) return;
    setMessage(null);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ circleId }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Could not share report.");
      return;
    }
    setShares((current) => [payload as ReportShare, ...current.filter((share) => share.circleId !== circleId)]);
    setCircleId("");
    setMessage("Report shared with explicit consent.");
  }

  async function revokeShare(nextCircleId: string) {
    if (!token || !process.env.NEXT_PUBLIC_API_URL) return;
    setMessage(null);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/shares?circleId=${nextCircleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Could not revoke sharing.");
      return;
    }
    setShares((current) =>
      current.map((share) => (share.circleId === nextCircleId ? { ...share, status: "revoked", revokedAt: new Date().toISOString() } : share))
    );
    setMessage("Report sharing revoked.");
  }

  return (
    <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">Explicit Circle Sharing</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            This report is private until you share it with a circle. View-only members can read shared reports but cannot add new ones.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Select value={circleId} onChange={(event) => setCircleId(event.target.value)} disabled={loading || !shareableCircles.length}>
          <option value="">{shareableCircles.length ? "Choose a circle" : "No shareable circles"}</option>
          {shareableCircles.map((circle) => (
            <option key={circle.id} value={circle.id}>
              {circle.name}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={() => void shareReport()} disabled={!circleId || loading} className="gap-2">
          <UsersRound className="h-4 w-4" />
          Share
        </Button>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{message}</p> : null}
      {shares.length ? (
        <div className="mt-4 space-y-2">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-slate-900">{share.circleName}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">{share.status}</span>
              </span>
              {share.status === "active" ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => void revokeShare(share.circleId)}>
                  Revoke
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function attentionVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score <= 1) return "success";
  if (score <= 3) return "warning";
  return "danger";
}

function formatRange(low?: number | null, high?: number | null, unit?: string) {
  if (typeof low === "number" && typeof high === "number") return `${low}-${high} ${unit ?? ""}`.trim();
  if (typeof low === "number") return `>= ${low} ${unit ?? ""}`.trim();
  if (typeof high === "number") return `<= ${high} ${unit ?? ""}`.trim();
  return "Reference range not provided";
}
