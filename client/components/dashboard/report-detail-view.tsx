"use client";

import { useEffect, useState } from "react";
import { Activity, FileText, Pill, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/reports/chat-panel";
import { DietAdvicePanel } from "@/components/reports/diet-advice-panel";
import { LifestyleCorrelationCard } from "@/components/reports/lifestyle-correlation-card";
import { MedicationCard } from "@/components/reports/medication-card";
import { MedicationConflictPanel } from "@/components/reports/medication-conflict-panel";
import { SummaryGenerator } from "@/components/reports/summary-generator";
import { VoiceReadout } from "@/components/reports/voice-readout";
import { Report } from "@/lib/types";

export function ReportDetailView({
  report,
  onClose
}: {
  report: Report | null;
  onClose: () => void;
}) {
  const [displayReport, setDisplayReport] = useState<Report | null>(report);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (report) {
      setDisplayReport(report);
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
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
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

          {displayReport.structuredData.length ? (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-500" />
                Parsed Values
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Parameter</span>
                  <span>Value</span>
                  <span>Range</span>
                  <span>Status</span>
                </div>
                {displayReport.structuredData.map((item) => (
                  <div
                    key={`${item.testName}-${item.unit}`}
                    className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 border-t border-slate-100 px-3 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-900">{item.testName}</span>
                    <span className="text-slate-700">
                      {item.value} {item.unit}
                    </span>
                    <span className="text-slate-500">
                      {formatRange(item.referenceRangeLow, item.referenceRangeHigh, item.unit)}
                    </span>
                    <Badge variant={item.flag === "normal" ? "success" : "warning"}>{item.flag}</Badge>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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

          <SummaryGenerator reportId={displayReport._id} />

          {displayReport.medications?.length ? (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <Pill className="h-4 w-4 text-slate-500" />
                Prescription Details
              </h3>
              {displayReport.medications.map((medication) => (
                <MedicationCard key={medication.name} medication={medication} />
              ))}
              <MedicationConflictPanel />
            </section>
          ) : null}

          <DietAdvicePanel reportId={displayReport._id} />

          <ChatPanel
            reportId={displayReport._id}
            language={displayReport.language}
            initialMessages={displayReport.chatHistory ?? []}
          />

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Confidence note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{displayReport.aiExplanation.confidenceNote}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Disclaimer</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{displayReport.aiExplanation.disclaimer}</p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function attentionVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score <= 1) return "success";
  if (score <= 3) return "warning";
  return "danger";
}

function formatRange(low?: number | null, high?: number | null, unit?: string) {
  if (typeof low === "number" && typeof high === "number") return `${low}-${high} ${unit ?? ""}`.trim();
  if (typeof low === "number") return `>${low} ${unit ?? ""}`.trim();
  if (typeof high === "number") return `<${high} ${unit ?? ""}`.trim();
  return "--";
}
