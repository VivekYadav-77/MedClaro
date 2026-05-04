import type { ElementType } from "react";
import { Activity, ArrowRight, FileText, Pill, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Report } from "@/lib/types";

const reportMeta: Record<string, { icon: ElementType; label: string; color: string }> = {
  blood_test: { icon: Activity, label: "Blood Test", color: "bg-red-50 text-red-600" },
  prescription: { icon: Pill, label: "Prescription", color: "bg-purple-50 text-purple-600" },
  lipid_panel: { icon: Stethoscope, label: "Lipid Panel", color: "bg-blue-50 text-blue-600" },
  default: { icon: FileText, label: "Report", color: "bg-slate-100 text-slate-600" }
};

function attentionVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score <= 1) return "success";
  if (score <= 3) return "warning";
  return "danger";
}

export function ReportCard({
  report,
  onSelect
}: {
  report: Report;
  onSelect: () => void;
}) {
  const meta = reportMeta[report.reportType as keyof typeof reportMeta] ?? reportMeta.default;
  const Icon = meta.icon;
  const score = report.aiExplanation?.attentionScore ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      aria-label={`Open ${meta.label} report`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold capitalize text-slate-900">{report.reportType.replace(/_/g, " ")}</p>
            <p className="text-sm text-slate-500">{report.labName || "Unknown lab"}</p>
          </div>
        </div>

        <Badge variant={attentionVariant(score)}>{score}/5 attention</Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-2">
        {report.aiExplanation?.holisticSummary}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          {new Date(report.reportDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </span>
        <span className="flex items-center gap-1 font-medium text-brand-600 transition-all group-hover:gap-2">
          View report <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
