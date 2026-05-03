import { TrendChart } from "@/components/reports/trend-chart";
import { Card } from "@/components/ui/card";
import { getTrends } from "@/lib/api";
import { TrendingUp, Calendar } from "lucide-react";

export default async function TrendsPage() {
  const trends = await getTrends();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Trend View</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
          See what has moved, not just what looks off today.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Charts compare normalized values, show reference bands behind the lines, and look for slow patterns across reports and seasons.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-5 p-5">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <TrendingUp className="h-6 w-6 text-brand-600" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Composite Health Score</p>
            <p className="mt-0.5 font-display text-3xl font-bold text-slate-900">{trends.compositeScore?.slice(-1)[0]?.score ?? "—"}</p>
            <p className="text-xs text-slate-400">Weighted from all tracked parameters</p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100">
            <Calendar className="h-6 w-6 text-teal-600" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Seasonal Insight</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {trends.seasonalInsights?.[0] ?? "More yearly history is needed before seasonal insights appear."}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {trends.series?.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {trends.series.map((series) => (
            <TrendChart key={series.parameter} series={series} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">No trend data yet</h3>
          <p className="mt-1 text-sm text-slate-500">Upload at least two reports to start seeing trends.</p>
        </div>
      )}
    </div>
  );
}
