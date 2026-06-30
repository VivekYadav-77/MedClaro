import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { TrendResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Trajectory = TrendResponse["trajectories"][number];

export function TrajectoryCard({ trajectory }: { trajectory: Trajectory }) {
  const bgGradient = trajectory.warningLevel === "alert"
    ? "bg-gradient-to-br from-red-50/80 to-transparent dark:from-red-950/30 border-red-100"
    : trajectory.warningLevel === "watch"
      ? "bg-gradient-to-br from-amber-50/80 to-transparent dark:from-amber-950/30 border-amber-100"
      : trajectory.direction === "improving"
        ? "bg-gradient-to-br from-teal-50/80 to-transparent dark:from-teal-950/30 border-teal-100"
        : "";

  return (
    <BentoCard className={cn("space-y-4 h-full flex flex-col justify-between", bgGradient)}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900">{trajectory.parameter}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {directionIcon(trajectory.direction)}
              {trajectory.direction}
            </p>
          </div>
          <Badge variant={trajectory.warningLevel === "alert" ? "danger" : trajectory.warningLevel === "watch" ? "warning" : "success"}>
            {trajectory.warningLevel}
          </Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{trajectory.prediction}</p>
      </div>
      <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 font-medium">{trajectory.advice}</p>
    </BentoCard>
  );
}

function directionIcon(direction: Trajectory["direction"]) {
  if (direction === "improving") return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  if (direction === "declining") return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <ArrowRight className="h-4 w-4 text-slate-500" />;
}
