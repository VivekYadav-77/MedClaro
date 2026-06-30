"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Pill, Search, Stethoscope, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Timeline } from "@/components/dashboard/timeline";
import { Report } from "@/lib/types";

type Filter = "all" | "prescriptions" | "abnormal";

export function ReportHistoryClient({
  reports,
  eyebrow = "Report History",
  title = "All analyzed reports",
  description = "Open any report as a full page with values, doctor export, diet, medication, chat, and sharing context.",
}: {
  reports: Report[];
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const initialFilter: Filter = focus === "grocery" ? "abnormal" : "all";
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [chooserOpen, setChooserOpen] = useState(focus === "ehr-export");

  const visibleReports = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (filter === "prescriptions" && report.reportType !== "prescription" && !(report.medications?.length)) return false;
      if (filter === "abnormal" && !report.structuredData.some((item) => item.flag !== "normal")) return false;
      if (!lowered) return true;
      return [report.labName, report.reportType, report.familyMemberName, report.ownerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowered));
    });
  }, [filter, query, reports]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <BentoCard className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-gradient-to-r from-brand-50 to-white border-brand-100/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => router.push("/reports/upload")}>
          <Upload className="h-4 w-4" />
          Upload report
        </Button>
      </BentoCard>

      <BentoCard className="grid gap-4 lg:grid-cols-[1fr_auto] p-4 lg:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9 h-11 bg-slate-50 border-slate-200" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lab, report type, or family member" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} icon={FileText} label="All" onClick={() => setFilter("all")} />
          <FilterButton active={filter === "prescriptions"} icon={Pill} label="Prescriptions" onClick={() => setFilter("prescriptions")} />
          <FilterButton active={filter === "abnormal"} icon={Stethoscope} label="Abnormal" onClick={() => setFilter("abnormal")} />
        </div>
      </BentoCard>

      {visibleReports.length ? (
        <Timeline reports={visibleReports} onSelectReport={(report) => router.push(`/reports/${report._id}`)} />
      ) : (
        <BentoCard className="flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50 min-h-[300px]">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
            <FileText className="h-8 w-8 text-slate-300" />
          </span>
          <h2 className="font-display text-xl font-bold text-slate-900">No matching reports</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">Try another filter or upload a new report to see it here.</p>
        </BentoCard>
      )}

      {chooserOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setChooserOpen(false)}
            aria-label="Close EHR export chooser"
          />
          <BentoCard noPadding className="relative z-10 max-h-[86vh] w-full max-w-3xl overflow-hidden shadow-2xl border-white/10">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">EHR Export</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Choose a report for doctor export</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">Select the analyzed report you want to turn into a clinical handoff table.</p>
              </div>
              <button
                type="button"
                onClick={() => setChooserOpen(false)}
                className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Close EHR export chooser"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[62vh] space-y-3 overflow-y-auto p-6 bg-slate-50/50">
              {reports.length ? (
                reports.map((report) => (
                  <button
                    key={report._id}
                    type="button"
                    onClick={() => router.push(`/reports/${report._id}?tab=doctor-export`)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-brand-200 hover:bg-brand-50/50 transition-all shadow-sm"
                  >
                    <span>
                      <span className="block font-display font-bold text-slate-900 text-lg">{report.labName || "Health Report"}</span>
                      <span className="mt-1 block text-sm font-medium text-slate-500">
                        {report.reportType.replace(/_/g, " ")} - {new Date(report.reportDate).toLocaleDateString("en-IN")}
                        {report.familyMemberName || report.ownerName ? ` - ${report.familyMemberName ?? report.ownerName}` : ""}
                      </span>
                    </span>
                    <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 border border-brand-100">Export</span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center bg-white">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 font-display font-bold text-slate-900 text-lg">No reports available</p>
                  <p className="mt-2 text-sm text-slate-500">Upload an analyzed report before creating an EHR export.</p>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
        active ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
