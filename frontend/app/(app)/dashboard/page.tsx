import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { Timeline } from "@/components/dashboard/timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getReports, getUserProfile } from "@/lib/api";

export default async function DashboardPage() {
  const [user, reports] = await Promise.all([getUserProfile(), getReports()]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 bg-white/90">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Dashboard</p>
          <h1 className="font-display text-4xl text-ink">Your health timeline, {user.name.split(" ")[0]}.</h1>
          <p className="max-w-2xl text-sm leading-7 text-[#355166]">
            Review report history, check calm attention scores, and open any report to ask follow-up questions grounded in the exact values already uploaded.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/reports/upload">
              <Button className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Upload another report
              </Button>
            </Link>
            <Link href="/trends">
              <Button variant="soft" className="w-full gap-2 sm:w-auto">
                <Sparkles className="h-4 w-4" />
                View trend insights
              </Button>
            </Link>
          </div>
        </Card>
        <Card className="space-y-4 bg-mist/80">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Gentle weekly nudge</p>
          <h2 className="font-display text-3xl">Ferritin has stayed below range in your last 2 reports.</h2>
          <p className="text-sm leading-7 text-[#355166]">Worth mentioning at your next appointment, especially alongside fatigue or lower exercise stamina.</p>
          <div className="rounded-3xl bg-white p-4 text-sm text-[#355166]">
            Retest reminder: blood work follow-up scheduled for June 11, 2026.
          </div>
        </Card>
      </section>
      {reports.length ? (
        <Timeline reports={reports} />
      ) : (
        <Card className="text-center text-sm text-[#5b7686]">No reports yet - upload your first blood report to get started.</Card>
      )}
    </div>
  );
}
