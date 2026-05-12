import { notFound } from "next/navigation";

import { ReportDetailClient } from "@/components/reports/report-detail-client";
import { getReport } from "@/lib/api";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id).catch(() => null);

  if (!report) {
    notFound();
  }

  return <ReportDetailClient report={report} />;
}
