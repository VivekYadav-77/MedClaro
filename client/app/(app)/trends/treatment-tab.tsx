"use client";

import { useEffect, useState } from "react";
import { Loader2, Pill } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

type TreatmentFinding = {
  medicationName: string;
  targetMarker: string;
  startDate: string;
  trend: "improving" | "not_improving" | "worsening";
  recommendation: string;
  urgency: "low" | "medium" | "high";
};

type TreatmentResponse = {
  findings: TreatmentFinding[];
  overallAssessment?: string;
  message?: string;
};

export function TreatmentTab() {
  const { data: session } = useSession();
  const [data, setData] = useState<TreatmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken || !process.env.NEXT_PUBLIC_API_URL) {
      setData({ findings: [], message: "Connect to the API to analyze treatment effectiveness." });
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      try {
        const circleId = window.localStorage.getItem("selectedCircleId");
        const suffix = circleId ? `?circleId=${circleId}` : "";
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/treatment-effectiveness${suffix}`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined,
        });
        const payload = await response.json().catch(() => null);
        setData(response.ok ? payload : { findings: [], message: payload?.error ?? "Could not load treatment analysis." });
      } catch {
        setData({ findings: [], message: "Could not load treatment analysis." });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <BentoCard className="flex items-center gap-3 p-5 text-sm text-slate-500 justify-center min-h-[150px]">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        <span className="font-medium text-slate-600">Checking treatment timeline...</span>
      </BentoCard>
    );
  }

  return (
    <div className="space-y-5">
      {data?.overallAssessment ? (
        <BentoCard className="bg-gradient-to-r from-brand-50 to-white border-brand-100/50 shadow-sm p-5">
          <p className="text-sm leading-relaxed text-brand-900 font-medium">{data.overallAssessment}</p>
        </BentoCard>
      ) : data?.message ? (
        <BentoCard className="p-5">
          <p className="text-sm text-slate-600">{data.message}</p>
        </BentoCard>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        {data?.findings?.map((finding) => (
          <BentoCard key={`${finding.medicationName}-${finding.targetMarker}`} className={cn("space-y-4 border-l-4 h-full flex flex-col justify-between", urgencyBorder(finding.urgency))}>
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Pill className="h-4 w-4" />
                    </span>
                    {finding.medicationName}
                  </h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Target: {finding.targetMarker}</p>
                </div>
                <Badge variant={trendVariant(finding.trend)} className="rounded-md px-2 py-0.5">{finding.trend.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{finding.recommendation}</p>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgency: {finding.urgency}</p>
          </BentoCard>
        ))}
      </div>
    </div>
  );
}

function trendVariant(trend: TreatmentFinding["trend"]) {
  if (trend === "improving") return "success";
  if (trend === "worsening") return "danger";
  return "warning";
}

function urgencyBorder(urgency: TreatmentFinding["urgency"]) {
  if (urgency === "high") return "border-l-red-500";
  if (urgency === "medium") return "border-l-amber-500";
  return "border-l-emerald-500";
}
