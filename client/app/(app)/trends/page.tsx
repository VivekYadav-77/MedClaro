import { TrendChart } from "@/components/reports/trend-chart";
import { TrajectoryCard } from "@/components/reports/trajectory-card";
import { RelatedActions } from "@/components/journeys/related-actions";
import { BentoCard } from "@/components/ui/bento-card";
import { BentoGrid } from "@/components/ui/bento-grid";
import { getTrends } from "@/lib/api";
import { trendsRelatedActions } from "@/lib/journeys";
import { AlertTriangle, Calendar, ScanSearch, Stethoscope, TrendingUp, type LucideIcon } from "lucide-react";
import { TreatmentTab } from "@/app/(app)/trends/treatment-tab";

export default async function TrendsPage() {
  const trends = await getTrends();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <BentoCard className="bg-gradient-to-r from-teal-50 to-white border-teal-100/50">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Clinical Trends</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 tracking-tight">
          Guideline alerts, variance checks, and treatment movement.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Charts compare normalized values, show reference bands behind the lines, and look for slow patterns across reports and seasons.
        </p>
      </BentoCard>

      <BentoGrid className="!grid-cols-1 md:!grid-cols-3 gap-5">
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
      </BentoGrid>

      {trends.labVariance?.length ? (
        <section className="space-y-4 pt-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Lab Variance Checks</h2>
            <p className="mt-1 text-sm text-slate-500">Large jumps are framed as repeat-test discussion points, not diagnoses.</p>
          </div>
          <BentoGrid className="!grid-cols-1 md:!grid-cols-2 gap-5">
            {trends.labVariance.map((item) => (
              <BentoCard key={`${item.parameter}-${item.deltaPercent}`} className="border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <ScanSearch className="h-4 w-4" />
                  </span>
                  <p className="font-display font-bold text-amber-950">{item.parameter}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-amber-900 font-medium">{item.message}</p>
              </BentoCard>
            ))}
          </BentoGrid>
        </section>
      ) : null}

      {/* Stats row */}
      <BentoGrid className="!grid-cols-1 sm:!grid-cols-2 gap-5 mt-6">
        <BentoCard className="flex flex-col justify-center h-full">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 shadow-sm">
              <TrendingUp className="h-6 w-6 text-brand-600" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Composite Health Score</p>
              <p className="mt-1 font-display text-4xl font-bold text-slate-900 tracking-tight">{trends.compositeScore?.slice(-1)[0]?.score ?? "—"}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Weighted from all tracked parameters</p>
            </div>
          </div>
        </BentoCard>
        <BentoCard className="flex flex-col justify-center h-full bg-slate-900 text-white">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Calendar className="h-6 w-6 text-teal-400" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seasonal Insight</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 font-medium">
                {trends.seasonalInsights?.[0] ?? "More yearly history is needed before seasonal insights appear."}
              </p>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Charts */}
      {trends.series?.length ? (
        <BentoGrid className="!grid-cols-1 xl:!grid-cols-2 gap-5 pt-4 mt-4">
          <div className="xl:col-span-2">
            <h2 className="font-display text-2xl font-bold text-slate-900">Marker Trends</h2>
            <p className="mt-1 text-sm text-slate-500">Historical data visualizations with reference bands.</p>
          </div>
          {trends.series.map((series) => (
            <TrendChart key={series.parameter} series={series} />
          ))}
        </BentoGrid>
      ) : (
        <BentoCard className="flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50 min-h-[300px] mt-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
            <TrendingUp className="h-8 w-8 text-slate-300" />
          </span>
          <h3 className="font-display text-xl font-bold text-slate-900">No trend data yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">Upload at least two reports to start seeing AI-generated health trends and trajectories.</p>
        </BentoCard>
      )}

      {trends.trajectories?.length ? (
        <section className="space-y-5 pt-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">AI Health Trajectories</h2>
            <p className="mt-1 text-sm text-slate-500">Forward-looking analysis based on your report history.</p>
          </div>
          <BentoGrid className="!grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 gap-5">
            {trends.trajectories.map((trajectory) => (
              <TrajectoryCard key={trajectory.parameter} trajectory={trajectory} />
            ))}
          </BentoGrid>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Treatment Effectiveness</h2>
          <p className="mt-1 text-sm text-slate-500">Compares prescription timing against later report movement.</p>
        </div>
        <TreatmentTab />
      </section>

      <RelatedActions title="Turn trends into action" actions={trendsRelatedActions} />
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
    <BentoCard className="p-5 h-full flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-inner">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-display font-bold text-slate-900">{title}</p>
            <span className="rounded-md bg-white border border-slate-200 shadow-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">{status}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
        </div>
      </div>
    </BentoCard>
  );
}
