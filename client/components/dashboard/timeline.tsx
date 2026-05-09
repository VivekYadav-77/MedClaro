import { Report } from "@/lib/types";
import { ReportCard } from "@/components/dashboard/report-card";

export function Timeline({
  reports,
  onSelectReport
}: {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}) {
  const grouped = reports.reduce<Record<string, Report[]>>((acc, report) => {
    const year = new Date(report.reportDate).getFullYear().toString();
    acc[year] ??= [];
    acc[year].push(report);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, yearReports]) => (
          <section key={year}>
            {/* Year marker */}
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                {year}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">{yearReports.length} report{yearReports.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Vertical timeline */}
            <div className="relative space-y-4 pl-6">
              {/* Connecting line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

              {yearReports.map((report, index) => (
                <div
                  key={report._id}
                  className="group relative animate-slide-up"
                  style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[18px] top-4 h-3 w-3 rounded-full border-2 border-brand-500 bg-white transition-transform duration-200 group-hover:scale-110" />
                  <ReportCard report={report} onSelect={() => onSelectReport(report)} />
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
