import { TrendChart } from "@/components/reports/trend-chart";
import { TrajectoryCard } from "@/components/reports/trajectory-card";
import { Card } from "@/components/ui/card";
import { getTrends } from "@/lib/api";
import { AlertTriangle, Calendar, ScanSearch, Stethoscope, TrendingUp, type LucideIcon } from "lucide-react";
import { TreatmentTab } from "@/app/(app)/trends/treatment-tab";

export default async function TrendsPage() {
  const trends = await getTrends();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Clinical Trends</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Guideline alerts, variance checks, and treatment movement.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Charts compare normalized values, show reference bands behind the lines, and look for slow patterns across reports and seasons.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ClinicalTrendCard
          icon={Stethoscope}
          title="Guideline source"
          status={trends.series?.length ? "Live preview" : "Needs repeat data"}
          body="Current trajectory cards use trend direction and reference ranges. Formal ADA/AHA/nephrology source packs can be layered in later."
        />
        <ClinicalTrendCard
          icon={ScanSearch}
          title="Lab variance"
          status={trends.labVariance?.length ? "Review" : trends.series?.length ? "Watching" : "No repeat data"}
          body="Repeat-marker delta rules flag improbable jumps as repeat-test discussion points before users panic."
        />
        <ClinicalTrendCard
          icon={AlertTriangle}
          title="Clinical escalation"
          status={trends.trajectories?.some((item) => item.warningLevel === "alert") ? "Review" : "Watch"}
          body="Alerts are preparation signals only. The app must not diagnose or change medication."
        />
      </div>

      {trends.labVariance?.length ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Lab Variance Checks</h2>
            <p className="mt-1 text-sm text-slate-500">Large jumps are framed as repeat-test discussion points, not diagnoses.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {trends.labVariance.map((item) => (
              <Card key={`${item.parameter}-${item.deltaPercent}`} className="border-amber-200 bg-amber-50 p-4 shadow-none">
                <p className="font-semibold text-amber-950">{item.parameter}</p>
                <p className="mt-2 text-sm leading-6 text-amber-900">{item.message}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

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

      {trends.trajectories?.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">AI Health Trajectories</h2>
            <p className="mt-1 text-sm text-slate-500">Forward-looking analysis based on your report history.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {trends.trajectories.map((trajectory) => (
              <TrajectoryCard key={trajectory.parameter} trajectory={trajectory} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Treatment Effectiveness</h2>
          <p className="mt-1 text-sm text-slate-500">Compares prescription timing against later report movement.</p>
        </div>
        <TreatmentTab />
      </section>
    </div>
  );
}

function ClinicalTrendCard({
  icon: Icon,
  title,
  status,
  body,
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  body: string;
}) {
  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{title}</p>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{status}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </Card>
  );
}
