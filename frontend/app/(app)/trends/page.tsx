import { TrendChart } from "@/components/reports/trend-chart";
import { Card } from "@/components/ui/card";
import { getTrends } from "@/lib/api";

export default async function TrendsPage() {
  const trends = await getTrends();

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Trend view</p>
        <h1 className="font-display text-4xl text-ink">See what has moved, not just what looks off today.</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#355166]">
          Charts compare normalized values, show reference bands behind the lines, and look for slow patterns across repeated reports and seasons.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-mist p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b8292]">Composite health score</p>
            <p className="mt-2 font-display text-4xl">72</p>
            <p className="mt-2 text-sm text-[#355166]">A weighted view built from all currently tracked parameters.</p>
          </div>
          <div className="rounded-[28px] bg-foam p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b8292]">Seasonal insight</p>
            <p className="mt-2 text-sm leading-7 text-[#355166]">{trends.seasonalInsights[0] ?? "More yearly history is needed before seasonal insights appear."}</p>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {trends.series.map((series) => (
          <TrendChart key={series.parameter} series={series} />
        ))}
      </div>
    </div>
  );
}
