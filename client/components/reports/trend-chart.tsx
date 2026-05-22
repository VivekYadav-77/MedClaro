"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendSeries } from "@/lib/types";

export function TrendChart({ series }: { series: TrendSeries }) {
  const data = series.points.map((point, index) => ({
    ...point,
    index,
    dateLabel: formatDate(point.date),
  }));
  const validRanges = data.filter((point) => point.low != null && point.high != null);
  const sortedRanges = [...validRanges].sort((a, b) => Number(a.low) - Number(b.low) || Number(a.high) - Number(b.high));
  const referenceRange = sortedRanges.length ? sortedRanges[Math.floor(sortedRanges.length / 2)] : null;
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const latestValue = Number(latest?.value);
  const previousValue = Number(previous?.value);
  const movement =
    Number.isFinite(latestValue) && Number.isFinite(previousValue)
      ? latestValue > previousValue
        ? "Rising"
        : latestValue < previousValue
          ? "Falling"
          : "Stable"
      : "Tracking";
  const domain = buildYAxisDomain(data, referenceRange);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{series.parameter}</h3>
            <Badge variant={movement === "Rising" ? "warning" : movement === "Falling" ? "brand" : "default"}>{movement}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{series.trendSummary}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest</p>
          <p className="mt-1 text-lg font-bold text-slate-950">
            {latest ? `${latest.value} ${series.normalizedUnit || ""}`.trim() : "--"}
          </p>
          <p className="text-xs font-semibold text-brand-700">{series.deltaText}</p>
        </div>
      </div>
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 14, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={54}
              domain={domain}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => compactNumber(value)}
              label={{
                value: series.normalizedUnit,
                angle: -90,
                position: "insideLeft",
                fill: "#64748b",
                fontSize: 11,
              }}
            />
            <Tooltip content={<TrendTooltip unit={series.normalizedUnit} />} cursor={{ stroke: "#0f766e", strokeDasharray: "4 4" }} />
            {referenceRange ? (
              <ReferenceArea
                y1={referenceRange.low ?? 0}
                y2={referenceRange.high ?? 0}
                fill="#ccfbf1"
                fillOpacity={0.55}
                stroke="#5eead4"
                strokeOpacity={0.35}
              />
            ) : null}
            <Area type="monotone" dataKey="value" stroke="none" fill="#0ea5e9" fillOpacity={0.08} activeDot={false} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={3}
              dot={{ fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2, r: 4 }}
              activeDot={{ fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2, r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {referenceRange ? (
          <span className="rounded-md bg-teal-50 px-2 py-1 font-medium text-teal-800">
            Reference band: {referenceRange.low}-{referenceRange.high} {series.normalizedUnit}
          </span>
        ) : (
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">No reference band in saved reports</span>
        )}
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">{data.length} report points</span>
      </div>
    </Card>
  );
}

function TrendTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { payload: { value: number; low?: number | null; high?: number | null } }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-slate-700">
        Value: <span className="font-semibold">{point.value} {unit}</span>
      </p>
      {point.low != null && point.high != null ? (
        <p className="mt-1 text-xs text-slate-500">Range: {point.low}-{point.high} {unit}</p>
      ) : null}
    </div>
  );
}

function buildYAxisDomain(
  data: { value: number; low?: number | null; high?: number | null }[],
  referenceRange: { low?: number | null; high?: number | null } | null,
): [number | "auto", number | "auto"] {
  const values = data.flatMap((point) => [point.value, point.low, point.high]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (referenceRange?.low != null) values.push(referenceRange.low);
  if (referenceRange?.high != null) values.push(referenceRange.high);
  if (!values.length) return ["auto", "auto"];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.18, Math.abs(max || min || 1) * 0.08, 1);
  return [Math.max(0, Math.floor((min - padding) * 10) / 10), Math.ceil((max + padding) * 10) / 10];
}

function compactNumber(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (Math.abs(number) >= 1000) return `${Math.round(number / 1000)}k`;
  return String(Number.isInteger(number) ? number : Number(number.toFixed(1)));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}
