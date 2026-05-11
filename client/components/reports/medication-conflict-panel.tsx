"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type MedicationConflict = {
  severity: "low" | "medium" | "high";
  title: string;
  medications: string[];
  reason: string;
  action: string;
};

type MedicationConflictResponse = {
  conflicts: MedicationConflict[];
  overallMessage: string;
};

export function MedicationConflictPanel() {
  const { data: session } = useSession();
  const [data, setData] = useState<MedicationConflictResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
      setData({ conflicts: [], overallMessage: "Connect to the API to screen medication conflicts." });
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const circleId = window.localStorage.getItem("selectedCircleId");
        const suffix = circleId ? `?circleId=${circleId}` : "";
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/medication-conflicts${suffix}`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        const payload = await response.json().catch(() => null);
        setData(response.ok ? payload : { conflicts: [], overallMessage: payload?.error ?? "Could not screen medications." });
      } catch {
        setData({ conflicts: [], overallMessage: "Could not screen medications." });
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Screening medication safety
      </Card>
    );
  }

  return (
    <Card className="space-y-4 border-amber-100 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          {data?.conflicts?.length ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">Medication Conflict Screen</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{data?.overallMessage}</p>
        </div>
      </div>
      {data?.conflicts?.length ? (
        <div className="space-y-3">
          {data.conflicts.map((conflict) => (
            <div key={`${conflict.title}-${conflict.medications.join(",")}`} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-900">{conflict.title}</p>
                <Badge variant={conflict.severity === "high" ? "danger" : conflict.severity === "medium" ? "warning" : "default"}>
                  {conflict.severity}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{conflict.reason}</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{conflict.action}</p>
              {conflict.medications.length ? (
                <p className="mt-2 text-xs text-slate-500">Related: {conflict.medications.join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
