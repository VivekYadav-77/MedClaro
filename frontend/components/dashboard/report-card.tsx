import Link from "next/link";
import { Activity, FileText, Pill } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Report } from "@/lib/types";

const iconMap = {
  blood_test: Activity,
  prescription: Pill,
  default: FileText
};

export function ReportCard({ report }: { report: Report }) {
  const Icon = iconMap[report.reportType as keyof typeof iconMap] ?? iconMap.default;
  return (
    <Link href={`/reports/${report._id}`}>
      <Card className="space-y-4 hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-sea">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold capitalize text-ink">{report.reportType.replace("_", " ")}</p>
              <p className="text-sm text-[#6b8292]">{report.labName}</p>
            </div>
          </div>
          <Badge>Attention {report.aiExplanation.attentionScore}/5</Badge>
        </div>
        <p className="text-sm leading-6 text-[#355166]">{report.aiExplanation.holisticSummary}</p>
        <div className="flex items-center justify-between text-xs text-[#6b8292]">
          <span>{new Date(report.reportDate).toLocaleDateString()}</span>
          <span>Open report</span>
        </div>
      </Card>
    </Link>
  );
}
