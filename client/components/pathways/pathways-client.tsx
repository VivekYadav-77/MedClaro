"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, HeartPulse, Loader2, Target } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Pathway = {
  condition: string;
  title: string;
  progressPercent: number;
  currentWeek: number;
  nextHabit: string;
  weeklyHabits: string[];
  markerGoals: string[];
  disclaimer: string;
};

export function PathwaysClient() {
  const { data: session } = useSession();
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [markerCount, setMarkerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pathways`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        setPathways(response.ok ? payload.pathways ?? [] : []);
        setMarkerCount(response.ok ? payload.markerCount ?? 0 : 0);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [session?.accessToken]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">90-Day Pathways</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Marker-seeded coaching pathways</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Uses saved abnormal markers to suggest careful habit pathways for prediabetes, fatty liver, hypertension, or general health foundations.
        </p>
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pathways
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="grid gap-4">
          {pathways.map((pathway) => (
            <Card key={pathway.condition} className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-950">
                    <HeartPulse className="h-5 w-5 text-brand-600" />
                    {pathway.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Week {pathway.currentWeek} of 13</p>
                </div>
                <Badge variant="warning">{pathway.condition.replace(/_/g, " ")}</Badge>
              </div>
              <Progress value={pathway.progressPercent} />
              <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Next habit</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{pathway.nextHabit}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <PathwayList icon={CheckCircle2} title="This week" items={pathway.weeklyHabits} />
                <PathwayList icon={Target} title="Marker goals" items={pathway.markerGoals} />
              </div>
              <p className="text-xs leading-5 text-slate-500">{pathway.disclaimer}</p>
            </Card>
          ))}
        </section>

        <Card className="h-fit space-y-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-slate-900">Pathway source</h2>
          <p className="text-sm leading-6 text-slate-600">
            {markerCount} out-of-range marker(s) were visible to the pathway engine. Upload repeat reports to make the pathway more specific.
          </p>
        </Card>
      </div>
    </div>
  );
}

function PathwayList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-brand-600" />
        {title}
      </p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
