import { Report } from "@/lib/types";
import { ReportCard } from "@/components/dashboard/report-card";

export function Timeline({ reports }: { reports: Report[] }) {
  const grouped = reports.reduce<Record<string, Report[]>>((acc, report) => {
    const year = new Date(report.reportDate).getFullYear().toString();
    acc[year] ??= [];
    acc[year].push(report);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped)
        .sort(([left], [right]) => Number(right) - Number(left))
        .map(([year, yearReports]) => (
          <section key={year} className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#6b8292]">{year}</span>
              <div className="h-px flex-1 bg-[#d7e9e6]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {yearReports.map((report) => (
                <ReportCard key={report._id} report={report} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
