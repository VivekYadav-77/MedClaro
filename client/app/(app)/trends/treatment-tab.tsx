"use client";

import { useEffect, useState } from "react";
import { Loader2, Pill } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/treatment-effectiveness`, {
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
      <Card className="flex items-center gap-3 p-5 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking treatment timeline
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data?.overallAssessment ? (
        <Card className="border-brand-100 bg-brand-50/60 p-4 text-sm leading-7 text-brand-900">
          {data.overallAssessment}
        </Card>
      ) : data?.message ? (
        <Card className="p-4 text-sm text-slate-600">{data.message}</Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.findings?.map((finding) => (
          <Card key={`${finding.medicationName}-${finding.targetMarker}`} className={cn("space-y-3 border-l-4 p-4", urgencyBorder(finding.urgency))}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Pill className="h-4 w-4 text-slate-500" />
                  {finding.medicationName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{finding.targetMarker}</p>
              </div>
              <Badge variant={trendVariant(finding.trend)}>{finding.trend.replace("_", " ")}</Badge>
            </div>
            <p className="text-sm leading-6 text-slate-700">{finding.recommendation}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Urgency: {finding.urgency}</p>
          </Card>
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
