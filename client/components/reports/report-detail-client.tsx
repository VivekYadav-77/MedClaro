"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Activity,
  ArrowLeft,
  ClipboardCopy,
  ClipboardList,
  FileDown,
  FileText,
  Pill,
  ShieldCheck,
  Stethoscope,
  TableProperties,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { Select } from "@/components/ui/select";
import { ChatPanel } from "@/components/reports/chat-panel";
import { DietAdvicePanel } from "@/components/reports/diet-advice-panel";
import { LifestyleCorrelationCard } from "@/components/reports/lifestyle-correlation-card";
import { MedicationCard } from "@/components/reports/medication-card";
import { SummaryGenerator } from "@/components/reports/summary-generator";
import { VoiceReadout } from "@/components/reports/voice-readout";
import { Circle, Report, ReportShare } from "@/lib/types";
import { loincHint, markerRisk } from "@/lib/clinical-features";
import { cn } from "@/lib/utils";

const tabs = ["summary", "values", "doctor-export", "meds", "diet", "chat", "sharing"] as const;
const primaryTabs: ReportTab[] = ["summary", "chat", "sharing"];
const detailTabs: ReportTab[] = ["values", "doctor-export", "meds", "diet"];
type ReportTab = (typeof tabs)[number];
type DoctorExportRow = {
  marker: string;
  value: number | string;
  unit: string;
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  referenceRangeText?: string;
  flag: string;
  loincCode?: string;
  risk: string;
};

const tabLabels: Record<ReportTab, string> = {
  summary: "Simple Summary",
  values: "Lab Values",
  "doctor-export": "Doctor Summary",
  meds: "Medicines",
  diet: "Food Advice",
  chat: "Ask a Question",
  sharing: "Share",
};

export function ReportDetailClient({ report }: { report: Report }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as ReportTab | null;
  const initialTab = requestedTab && tabs.includes(requestedTab) ? requestedTab : "summary";
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const score = report.aiExplanation?.attentionScore ?? 0;

  function changeTab(tab: ReportTab) {
    setActiveTab(tab);
    router.replace(`/reports/${report._id}?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => router.push("/reports/history")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Report history
      </button>

      <BentoCard className="space-y-5 p-6 bg-gradient-to-r from-brand-50 to-white border-brand-100/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{report.reportType.replace(/_/g, " ")}</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-slate-900 tracking-tight">{report.labName || "Health Report"}</h1>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {new Date(report.reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {report.familyMemberName || report.ownerName ? ` - ${report.familyMemberName ?? report.ownerName}` : ""}
            </p>
          </div>
          <Badge variant={attentionVariant(score)} className="rounded-md border border-white/50 px-3 py-1 shadow-sm">
            {score >= 4 ? "Needs attention" : score >= 2 ? "Worth checking" : "Looks calm"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-white/50 p-1.5 border border-slate-200 backdrop-blur-sm" role="tablist" aria-label="Report actions">
            {primaryTabs.map((tab) => (
              <button
                key={tab}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-bold transition-all duration-200",
                  activeTab === tab ? "bg-white text-brand-700 shadow-sm border border-slate-200/50" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
                onClick={() => changeTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
          <details className="rounded-xl border border-slate-200 bg-white/70 p-2">
            <summary className="cursor-pointer px-2 py-1 text-base font-semibold text-slate-800">More details</summary>
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {detailTabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-bold transition-all duration-200",
                activeTab === tab ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              onClick={() => changeTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tabLabels[tab]}
            </button>
              ))}
            </div>
          </details>
        </div>
      </BentoCard>

      {activeTab === "summary" ? <SummaryTab report={report} /> : null}
      {activeTab === "values" ? <ValuesTab report={report} /> : null}
      {activeTab === "doctor-export" ? <DoctorExportTab report={report} /> : null}
      {activeTab === "meds" ? <MedsTab report={report} /> : null}
      {activeTab === "diet" ? <DietAdvicePanel reportId={report._id} /> : null}
      {activeTab === "chat" ? <ChatPanel reportId={report._id} language={report.language} initialMessages={report.chatHistory ?? []} /> : null}
      {activeTab === "sharing" ? <ReportSharingTab report={report} /> : null}
    </div>
  );
}

function SummaryTab({ report }: { report: Report }) {
  return (
    <div className="space-y-5 pt-2">
      <BentoCard className="space-y-4 border-brand-100 bg-brand-50/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          <h2 className="font-display font-bold text-slate-900 text-2xl">Simple Summary</h2>
        </div>
        <p className="text-base leading-8 text-slate-800 font-medium">{report.aiExplanation.holisticSummary}</p>
        <VoiceReadout text={report.aiExplanation.holisticSummary} language={report.language} />
      </BentoCard>

      <BentoCard className="space-y-4 border-teal-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900">What should I do next?</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Talk to a doctor before changing medicines or treatment.",
            "Upload an older report to compare changes over time.",
            "Use Doctor Summary before your next visit.",
            "Share this report with family only when you are comfortable.",
          ].map((item) => (
            <p key={item} className="rounded-lg bg-slate-50 p-4 text-base leading-7 text-slate-800">{item}</p>
          ))}
        </div>
      </BentoCard>

      {report.aiExplanation.parameterLevel.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {report.aiExplanation.parameterLevel.map((item) => (
            <BentoCard key={item.parameter} className="p-5 h-full flex flex-col justify-between">
              <div>
                <p className="font-display font-bold text-slate-900 text-lg">{item.parameter}</p>
              <p className="mt-3 text-base leading-7 text-slate-700">{item.explanation}</p>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.confidence}</p>
            </BentoCard>
          ))}
        </section>
      ) : null}

      <LifestyleCorrelationCard correlation={report.aiExplanation.lifestyleCorrelation} />
    </div>
  );
}

function ValuesTab({ report }: { report: Report }) {
  if (!report.structuredData.length) {
    return <EmptyPanel icon={TableProperties} title="No parsed values" body="This report does not contain structured lab values." />;
  }
  return (
    <BentoCard noPadding className="overflow-x-auto pt-2">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="px-5 py-4 text-left">Parameter</th>
            <th className="px-5 py-4 text-left">Value</th>
            <th className="px-5 py-4 text-left">Range</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {report.structuredData.map((item) => (
            <tr key={`${item.testName}-${item.unit}`} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 font-semibold text-slate-900">{item.testName}</td>
              <td className="px-5 py-4 text-slate-700 font-medium">{item.value} {item.unit}</td>
              <td className="px-5 py-4 text-slate-500">{formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}</td>
              <td className="px-5 py-4"><Badge variant={item.flag === "normal" ? "success" : "warning"} className="rounded-md">{item.flag}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </BentoCard>
  );
}

function DoctorExportTab({ report }: { report: Report }) {
  const { data: session } = useSession();
  const [backendRows, setBackendRows] = useState<DoctorExportRow[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadExportRows() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken || !report.structuredData.length) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/ehr-export`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setMessage(payload?.error ?? "Using local export rows because the backend export did not respond.");
          return;
        }
        setBackendRows(payload.rows ?? []);
        setMessage(payload.generatedAt ? "Using backend EHR export rows from saved report analysis." : null);
      } catch {
        setMessage("Using local export rows because the backend export did not respond.");
      }
    }
    void loadExportRows();
  }, [report._id, report.structuredData.length, session?.accessToken]);

  const rows = useMemo(() => {
    if (backendRows?.length) {
      return backendRows.map((row) => ({
        item: {
          testName: row.marker,
          value: row.value,
          unit: row.unit,
          referenceRangeLow: row.referenceRangeLow ?? null,
          referenceRangeHigh: row.referenceRangeHigh ?? null,
          flag: row.flag as Report["structuredData"][number]["flag"],
        },
        risk: row.risk,
        loinc: row.loincCode ?? "Mapping pending",
        referenceRangeText: row.referenceRangeText,
      }));
    }
    return report.structuredData.map((item) => ({ item, risk: markerRisk(item), loinc: loincHint(item.testName), referenceRangeText: undefined }));
  }, [backendRows, report.structuredData]);
  const exportText = rows
    .map(({ item, risk, loinc, referenceRangeText }) => `${item.testName}\t${item.value} ${item.unit}\t${referenceRangeText ?? formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}\t${item.flag}\t${risk}\t${loinc}`)
    .join("\n");
  if (!report.structuredData.length) {
    return <EmptyPanel icon={Stethoscope} title="EHR export needs lab values" body="Prescription-only and unstructured reports cannot generate a lab handoff table yet." />;
  }
  return (
    <div className="space-y-5 pt-2">
      <BentoCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between bg-slate-50/50">
        <div>
          <h2 className="flex items-center gap-3 font-display font-bold text-slate-900 text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
              <Stethoscope className="h-4 w-4" />
            </span>
            Doctor Summary
          </h2>
          <p className="mt-2 text-base text-slate-700 leading-relaxed max-w-lg">A printable handoff you can take to your doctor. Please verify it with the original report.</p>
          {message ? <p className="mt-3 text-xs font-bold uppercase tracking-wider text-brand-700">{message}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(exportText)} className="rounded-xl">
            <ClipboardCopy className="h-4 w-4 mr-2" />
            Copy table
          </Button>
          <Button variant="soft" size="sm" onClick={() => printDoctorExport(report, rows)} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-2" />
            Print PDF
          </Button>
        </div>
      </BentoCard>
      <ValuesTab report={report} />
      <SummaryGenerator reportId={report._id} />
    </div>
  );
}

function MedsTab({ report }: { report: Report }) {
  const medicationCount = report.medications?.filter((medication) => medication.name).length ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat label="Medicines" value={String(medicationCount)} />
        <MiniStat label="Report type" value={report.reportType || "unknown"} />
      </div>
      {report.medications?.length ? (
        <div className="grid gap-3">
          {report.medications.map((medication) => (
            <MedicationCard key={medication.name} medication={medication} />
          ))}
        </div>
      ) : (
        <EmptyPanel icon={Pill} title="No medicines extracted" body="Upload or open a prescription report to review extracted medicine details." />
      )}
    </div>
  );
}

function ReportSharingTab({ report }: { report: Report }) {
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
      setMessage(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [circleResponse, shareResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/circles`, { headers, cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/shares`, { headers, cache: "no-store" }),
        ]);
        const circlePayload = await circleResponse.json().catch(() => []);
        const sharePayload = await shareResponse.json().catch(() => []);
        setCircles(circleResponse.ok ? circlePayload : []);
        setShares(shareResponse.ok ? sharePayload : []);
        if (!circleResponse.ok || !shareResponse.ok) {
          setMessage("Could not load all sharing details. Try refreshing this tab.");
        }
      } catch {
        setMessage("Could not load sharing details.");
      } finally {
        setLoading(false);
      }
    }
    void loadSharing();
  }, [isOwner, report._id, token]);

  async function shareReport() {
    if (!circleId || !token || !process.env.NEXT_PUBLIC_API_URL) return;
    setLoading(true);
    setMessage(null);
    try {
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
    } finally {
      setLoading(false);
    }
  }

  async function revokeShare(nextCircleId: string) {
    if (!token || !process.env.NEXT_PUBLIC_API_URL) return;
    setLoading(true);
    setMessage(null);
    try {
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
    } finally {
      setLoading(false);
    }
  }

  if (!isOwner) {
    return (
      <BentoCard className="p-6 mt-2">
        <h2 className="font-display font-bold text-slate-900 text-lg">Sharing</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
          This report is visible to you through your own access or a Care Circle share. Only the report owner can change sharing permissions.
        </p>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="space-y-6 border-teal-100 bg-teal-50/60 p-6 mt-2">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display font-bold text-slate-900 text-xl">Explicit Circle Sharing</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
            This report is private until you share it with a Care Circle. Active shares give view access to that circle.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
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
          {loading ? "Working..." : "Share"}
        </Button>
      </div>

      {message ? <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{message}</p> : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900">Current shares</p>
        {shares.length ? (
          shares.map((share) => (
            <div key={share.id} className="flex flex-col gap-2 rounded-lg bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-medium text-slate-900">{share.circleName}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">{share.status}</span>
              </span>
              {share.status === "active" ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => void revokeShare(share.circleId)} disabled={loading}>
                  Revoke
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-3 py-4 text-sm text-slate-500">
            This report has not been shared with any Care Circle yet.
          </p>
        )}
      </div>
    </BentoCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <BentoCard className="p-4 flex flex-col justify-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-display font-bold capitalize text-slate-900">{value}</p>
    </BentoCard>
  );
}

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof FileText; title: string; body: string }) {
  return (
    <BentoCard className="flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50 min-h-[300px]">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </span>
      <p className="font-display text-xl font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-sm text-center font-medium">{body}</p>
    </BentoCard>
  );
}

function attentionVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score <= 1) return "success";
  if (score <= 3) return "warning";
  return "danger";
}

function scoreLabel(score: number) {
  if (score >= 4) return "Needs attention";
  if (score >= 2) return "Worth checking";
  return "Looks calm";
}

function printDoctorExport(
  report: Report,
  rows: { item: Report["structuredData"][number]; risk: string; loinc: string; referenceRangeText?: string }[]
) {
  const printedAt = new Date().toLocaleString("en-IN");
  const reportDate = new Date(report.reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const rowsHtml = rows
    .map(({ item, risk, loinc, referenceRangeText }) => `
      <tr>
        <td>${escapeHtml(item.testName)}</td>
        <td>${escapeHtml(`${item.value} ${item.unit || ""}`.trim())}</td>
        <td>${escapeHtml(referenceRangeText ?? formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit))}</td>
        <td>${escapeHtml(item.flag)}</td>
        <td>${escapeHtml(risk)}</td>
        <td>${escapeHtml(loinc)}</td>
      </tr>
    `)
    .join("");
  const doc = window.open("", "_blank", "width=980,height=720");
  if (!doc) return;
  doc.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Doctor Summary - ${escapeHtml(report.labName || "Health Report")}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 32px; }
          header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 22px; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          h2 { font-size: 15px; margin: 22px 0 10px; color: #0f766e; }
          p { margin: 4px 0; font-size: 12px; line-height: 1.5; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-top: 12px; }
          .note { border: 1px solid #fde68a; background: #fffbeb; padding: 10px; border-radius: 6px; margin: 16px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #f1f5f9; text-align: left; color: #334155; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
          .footer { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #475569; }
          @media print { body { margin: 18mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Doctor Visit Export</h1>
          <p>Structured handoff generated from saved report analysis.</p>
          <div class="meta">
            <p><strong>Report:</strong> ${escapeHtml(report.labName || "Health Report")}</p>
            <p><strong>Report type:</strong> ${escapeHtml(report.reportType.replace(/_/g, " "))}</p>
            <p><strong>Report date:</strong> ${escapeHtml(reportDate)}</p>
            <p><strong>Patient/profile:</strong> ${escapeHtml(report.familyMemberName || report.ownerName || "Saved profile")}</p>
            <p><strong>Generated:</strong> ${escapeHtml(printedAt)}</p>
            <p><strong>Review level:</strong> ${escapeHtml(scoreLabel(report.aiExplanation?.attentionScore ?? 0))}</p>
          </div>
        </header>
        <section class="note">
          <p><strong>Clinical safety note:</strong> This export is a preparation aid from uploaded records. It is not a diagnosis and should be verified by a qualified clinician.</p>
        </section>
        <section>
          <h2>Summary</h2>
          <p>${escapeHtml(report.aiExplanation?.holisticSummary || "No summary available.")}</p>
        </section>
        <section>
          <h2>Lab Values</h2>
          <table>
            <thead>
              <tr>
                <th>Marker</th>
                <th>Value</th>
                <th>Reference range</th>
                <th>Flag</th>
                <th>Risk</th>
                <th>LOINC hint</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </section>
        <section class="footer">
          <p>Generated by ProjectHealth / MedClaro. Review source report before clinical decisions.</p>
        </section>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  doc.document.close();
}

function formatRange(low?: number | string | null, high?: number | string | null, unit?: string | null) {
  const lowValue = normalizeRangeValue(low);
  const highValue = normalizeRangeValue(high);
  const unitText = unit ? ` ${unit}` : "";
  if (lowValue && highValue) return `${lowValue}-${highValue}${unitText}`;
  if (lowValue) return `>= ${lowValue}${unitText}`;
  if (highValue) return `<= ${highValue}${unitText}`;
  return "Reference range not provided";
}

function normalizeRangeValue(value?: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
