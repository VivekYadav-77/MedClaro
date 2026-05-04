import { CheckCircle2, MinusCircle, TrendingDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ReportExplanation } from "@/lib/types";

export function LifestyleCorrelationCard({
  correlation
}: {
  correlation: ReportExplanation["lifestyleCorrelation"];
}) {
  if (!correlation) return null;

  return (
    <Card className="space-y-4 border-emerald-200 bg-emerald-50/50 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Lifestyle Correlation</p>
        <p className="mt-2 text-sm leading-7 text-emerald-900">{correlation.overallMessage}</p>
      </div>
      <div className="space-y-3">
        {correlation.correlations.map((item) => (
          <div key={item.note} className="rounded-xl bg-white p-3">
            <div className="flex items-start gap-2">
              {impactIcon(item.impact)}
              <div>
                <p className="font-medium text-slate-900">{item.note}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                {item.relatedMarkers.length ? (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Related: {item.relatedMarkers.join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function impactIcon(impact: "positive" | "neutral" | "negative") {
  if (impact === "positive") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />;
  if (impact === "negative") return <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />;
  return <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />;
}
