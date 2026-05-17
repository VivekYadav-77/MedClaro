import { ReportHistoryClient } from "@/components/reports/report-history-client";
import { getReports } from "@/lib/api";

export default async function ReportAnalysisPage() {
  const reports = await getReports();

  return (
    <ReportHistoryClient
      reports={reports}
      eyebrow="Report Analysis"
      title="Reports analysis"
      description="Review your analyzed lab reports in one dedicated page, then open any report for its full values, trend context, doctor export, and chat."
    />
  );
}
