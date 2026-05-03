import Link from "next/link";
import { Plus, Sparkles, TrendingUp, Upload } from "lucide-react";

import { Timeline } from "@/components/dashboard/timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getReports, getUserProfile } from "@/lib/api";

export default async function DashboardPage() {
  const [user, reports] = await Promise.all([getUserProfile(), getReports()]);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Good to see you,</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{firstName}'s Health Timeline</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/trends">
            <Button variant="outline" size="sm" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Trends
            </Button>
          </Link>
          <Link href="/reports/upload">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Upload Report
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Reports"
          value={String(reports.length)}
          sub="All time"
          accent="brand"
        />
        <StatCard
          label="Latest Attention Score"
          value={reports[0]?.aiExplanation?.attentionScore ? `${reports[0].aiExplanation.attentionScore}/5` : "—"}
          sub="Most recent report"
          accent="teal"
        />
        <StatCard
          label="Languages Supported"
          value="6"
          sub="en, hi, ta, bn, te, mr"
          accent="brand"
        />
      </div>

      {/* ── Main content + sidebar ───────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Timeline */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-slate-800">Report History</h2>
            <Link href="/reports/upload">
              <Button variant="ghost" size="sm" className="gap-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50">
                <Upload className="h-3.5 w-3.5" />
                Add report
              </Button>
            </Link>
          </div>
          {reports.length ? (
            <Timeline reports={reports} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                <Upload className="h-7 w-7 text-brand-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-900">No reports yet</h3>
              <p className="mt-1 text-sm text-slate-500">Upload your first blood report to get started with AI analysis.</p>
              <Link href="/reports/upload" className="mt-5 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Upload your first report
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Weekly nudge card */}
          <Card className="p-5 space-y-3 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weekly Nudge</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              Ferritin has stayed below range in your last 2 reports.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Worth mentioning at your next appointment, especially alongside fatigue or lower exercise stamina.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-sm text-amber-900">
              📅 Retest reminder: blood follow-up — June 11, 2026
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Actions</p>
            <div className="space-y-2">
              <Link href="/reports/upload" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">Upload a new report</span>
              </Link>
              <Link href="/trends" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">View trend charts</span>
              </Link>
              <Link href="/family" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">Manage family profiles</span>
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "brand" | "teal";
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div
        className={`h-10 w-1.5 flex-shrink-0 rounded-full ${
          accent === "teal" ? "bg-teal-400" : "bg-brand-400"
        }`}
      />
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
    </Card>
  );
}
