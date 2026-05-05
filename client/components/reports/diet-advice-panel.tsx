"use client";

import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DietAdvice = {
  marker: string;
  currentStatus: string;
  dietSuggestions: string[];
  foodsToAvoid: string[];
};

export function DietAdvicePanel({ reportId }: { reportId: string }) {
  const { data: session } = useSession();
  const [advice, setAdvice] = useState<DietAdvice[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchAdvice() {
    if (loading) return;
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
      setMessage("Connect to the API to load diet suggestions.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/diet-advice`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Could not load diet suggestions.");
        setAdvice([]);
        setFetched(true);
        return;
      }
      setAdvice(data.advice ?? []);
      setMessage(data.message ?? null);
      setFetched(true);
    } catch {
      setMessage("Could not load diet suggestions.");
      setAdvice([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Leaf className="h-4 w-4 text-emerald-600" />
            Diet Suggestions
          </h3>
          <p className="mt-1 text-sm text-slate-500">Local food ideas based on out-of-range markers.</p>
        </div>
        <Button variant="soft" size="sm" onClick={() => void fetchAdvice()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {fetched ? "Refresh" : "Get diet suggestions"}
        </Button>
      </div>
      {message ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</p> : null}
      {advice.length ? (
        <div className="grid gap-3">
          {advice.map((item) => (
            <div key={item.marker} className="rounded-xl border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{item.marker}</p>
              <p className="text-xs text-slate-500">{item.currentStatus}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Try</p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-900">
                    {item.dietSuggestions.map((food) => <li key={food}>{food}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Limit</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-900">
                    {item.foodsToAvoid.map((food) => <li key={food}>{food}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
