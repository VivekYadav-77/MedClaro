import { ReportHistoryClient } from "@/components/reports/report-history-client";
import { getReports } from "@/lib/api";

export default async function ReportHistoryPage() {
  const reports = await getReports();
  return <ReportHistoryClient reports={reports} />;
}
