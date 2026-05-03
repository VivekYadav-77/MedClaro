"use client";

import { Area, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { TrendSeries } from "@/lib/types";

export function TrendChart({ series }: { series: TrendSeries }) {
  const data = series.points.map((point) => ({
    ...point,
    dateLabel: new Date(point.date).toLocaleDateString(undefined, { month: "short", year: "2-digit" })
  }));

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{series.parameter}</h3>
          <p className="text-sm text-[#6b8292]">{series.trendSummary}</p>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink">{series.deltaText}</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <Tooltip />
            <ReferenceArea y1={data[0]?.low ?? 0} y2={data[0]?.high ?? 0} fill="#cae9e7" fillOpacity={0.35} />
            <Area type="monotone" dataKey="high" stroke="transparent" fill="#cae9e7" fillOpacity={0.15} />
            <Line type="monotone" dataKey="value" stroke="#163247" strokeWidth={3} dot={{ fill: "#72b7be", r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
