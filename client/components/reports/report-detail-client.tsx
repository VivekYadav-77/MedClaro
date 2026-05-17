"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ClipboardCopy,
  FileDown,
  FileText,
  Pill,
  Stethoscope,
  TableProperties,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatPanel } from "@/components/reports/chat-panel";
import { DietAdvicePanel } from "@/components/reports/diet-advice-panel";
import { LifestyleCorrelationCard } from "@/components/reports/lifestyle-correlation-card";
import { MedicationCard } from "@/components/reports/medication-card";
import { SummaryGenerator } from "@/components/reports/summary-generator";
import { VoiceReadout } from "@/components/reports/voice-readout";
import { Report } from "@/lib/types";
import { loincHint, markerRisk } from "@/lib/clinical-features";
import { cn } from "@/lib/utils";

const tabs = ["summary", "values", "doctor-export", "meds", "diet", "chat", "sharing"] as const;
type ReportTab = (typeof tabs)[number];

const tabLabels: Record<ReportTab, string> = {
  summary: "Summary",
  values: "Values",
  "doctor-export": "Doctor Export",
  meds: "Meds",
  diet: "Diet",
  chat: "Chat",
  sharing: "Sharing",
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

      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{report.reportType.replace(/_/g, " ")}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-slate-950">{report.labName || "Health Report"}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {new Date(report.reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {report.familyMemberName || report.ownerName ? ` - ${report.familyMemberName ?? report.ownerName}` : ""}
            </p>
          </div>
          <Badge variant={attentionVariant(score)}>{score}/5 attention</Badge>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                activeTab === tab ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:bg-white"
              )}
              onClick={() => changeTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === "summary" ? <SummaryTab report={report} /> : null}
      {activeTab === "values" ? <ValuesTab report={report} /> : null}
      {activeTab === "doctor-export" ? <DoctorExportTab report={report} /> : null}
      {activeTab === "meds" ? <MedsTab report={report} /> : null}
      {activeTab === "diet" ? <DietAdvicePanel reportId={report._id} /> : null}
      {activeTab === "chat" ? <ChatPanel reportId={report._id} language={report.language} initialMessages={report.chatHistory ?? []} /> : null}
      {activeTab === "sharing" ? <SharingPlaceholder /> : null}
    </div>
  );
}

function SummaryTab({ report }: { report: Report }) {
  return (
    <div className="space-y-5">
      <Card className="space-y-4 border-brand-100 bg-brand-50/70 p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-600" />
          <h2 className="font-semibold text-slate-900">Overall Summary</h2>
        </div>
        <p className="text-sm leading-7 text-slate-700">{report.aiExplanation.holisticSummary}</p>
        <VoiceReadout text={report.aiExplanation.holisticSummary} language={report.language} />
      </Card>

      {report.aiExplanation.parameterLevel.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {report.aiExplanation.parameterLevel.map((item) => (
            <Card key={item.parameter} className="p-4">
              <p className="font-semibold text-slate-900">{item.parameter}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.explanation}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{item.confidence}</p>
            </Card>
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
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Parameter</th>
            <th className="px-4 py-3 text-left">Value</th>
            <th className="px-4 py-3 text-left">Range</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {report.structuredData.map((item) => (
            <tr key={`${item.testName}-${item.unit}`} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">{item.testName}</td>
              <td className="px-4 py-3 text-slate-700">{item.value} {item.unit}</td>
              <td className="px-4 py-3 text-slate-500">{formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}</td>
              <td className="px-4 py-3"><Badge variant={item.flag === "normal" ? "success" : "warning"}>{item.flag}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function DoctorExportTab({ report }: { report: Report }) {
  if (!report.structuredData.length) {
    return <EmptyPanel icon={Stethoscope} title="EHR export needs lab values" body="Prescription-only and unstructured reports cannot generate a lab handoff table yet." />;
  }
  const rows = report.structuredData.map((item) => ({ item, risk: markerRisk(item), loinc: loincHint(item.testName) }));
  const exportText = rows
    .map(({ item, risk, loinc }) => `${item.testName}\t${item.value} ${item.unit}\t${formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}\t${item.flag}\t${risk}\t${loinc}`)
    .join("\n");
  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Stethoscope className="h-4 w-4 text-brand-600" />
            Doctor Export
          </h2>
          <p className="mt-1 text-sm text-slate-500">Tabular handoff with backend-compatible rows and local LOINC hints.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(exportText)}>
            <ClipboardCopy className="h-4 w-4" />
            Copy table
          </Button>
          <Button variant="soft" size="sm" onClick={() => printDoctorExport(report, rows)}>
            <FileDown className="h-4 w-4" />
            Print PDF
          </Button>
        </div>
      </Card>
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

function SharingPlaceholder() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900">Sharing</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Report sharing controls remain available from dashboard report context during this transition. Full-page sharing controls can be promoted here next.
      </p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold capitalize text-slate-950">{value}</p>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof FileText; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function attentionVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score <= 1) return "success";
  if (score <= 3) return "warning";
  return "danger";
}

function printDoctorExport(
  report: Report,
  rows: { item: Report["structuredData"][number]; risk: string; loinc: string }[]
) {
  const printedAt = new Date().toLocaleString("en-IN");
  const reportDate = new Date(report.reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const rowsHtml = rows
    .map(({ item, risk, loinc }) => `
      <tr>
        <td>${escapeHtml(item.testName)}</td>
        <td>${escapeHtml(`${item.value} ${item.unit || ""}`.trim())}</td>
        <td>${escapeHtml(formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit))}</td>
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
        <title>Doctor Export - ${escapeHtml(report.labName || "Health Report")}</title>
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
            <p><strong>Attention score:</strong> ${escapeHtml(String(report.aiExplanation?.attentionScore ?? "Not scored"))}/5</p>
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
