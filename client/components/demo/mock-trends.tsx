"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DemoProfile } from "@/components/demo/demo-container";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const series: Record<DemoProfile, Array<{ date: string; value: number; low: number; high: number }>> = {
  Self: [
    { date: "Jun 25", value: 12.3, low: 13.5, high: 17.5 },
    { date: "Dec 25", value: 11.7, low: 13.5, high: 17.5 },
    { date: "Mar 26", value: 11.2, low: 13.5, high: 17.5 }
  ],
  Mom: [
    { date: "Jun 25", value: 28, low: 30, high: 80 },
    { date: "Dec 25", value: 22, low: 30, high: 80 },
    { date: "Mar 26", value: 18, low: 30, high: 80 }
  ],
  Dad: [
    { date: "Jun 25", value: 6.8, low: 4, high: 5.7 },
    { date: "Dec 25", value: 7.1, low: 4, high: 5.7 },
    { date: "Mar 26", value: 7.4, low: 4, high: 5.7 }
  ]
};

const meta: Record<DemoProfile, { title: string; unit: string; note: string }> = {
  Self: { title: "Hemoglobin", unit: "g/dL", note: "Slow downward movement across three reports." },
  Mom: { title: "Vitamin D", unit: "ng/mL", note: "Below range, with winter dip clearly visible." },
  Dad: { title: "HbA1c", unit: "%", note: "Above target and rising across recent checks." }
};

export function MockTrends({ highContrast, profile }: { highContrast: boolean; profile: DemoProfile }) {
  const data = series[profile];

  return (
    <div className={cn("rounded-lg border border-slate-200 p-5", highContrast && "border-white/20")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="teal">Longitudinal trend</Badge>
          <h3 className="mt-3 font-display text-2xl font-bold">{meta[profile].title}</h3>
          <p className={cn("mt-1 text-sm text-slate-600", highContrast && "text-slate-200")}>{meta[profile].note}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-right text-sm">
          <p className="text-slate-500">Latest</p>
          <p className="font-semibold text-slate-900">
            {data[data.length - 1].value} {meta[profile].unit}
          </p>
        </div>
      </div>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={highContrast ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <Tooltip />
            <ReferenceArea y1={data[0].low} y2={data[0].high} fill="#ccfbf1" fillOpacity={0.55} />
            <Area type="monotone" dataKey="high" fill="#e0f2fe" stroke="transparent" fillOpacity={0.2} />
            <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={3} dot={{ fill: "#0d9488", r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
