import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Trajectory = TrendResponse["trajectories"][number];

export function TrajectoryCard({ trajectory }: { trajectory: Trajectory }) {
  const border = trajectory.warningLevel === "alert"
    ? "border-l-red-500"
    : trajectory.warningLevel === "watch"
      ? "border-l-amber-500"
      : trajectory.direction === "improving"
        ? "border-l-green-500"
        : "border-l-slate-400";

  return (
    <Card className={cn("space-y-3 border-l-4 p-4", border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{trajectory.parameter}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm capitalize text-slate-500">
            {directionIcon(trajectory.direction)}
            {trajectory.direction}
          </p>
        </div>
        <Badge variant={trajectory.warningLevel === "alert" ? "danger" : trajectory.warningLevel === "watch" ? "warning" : "success"}>
          {trajectory.warningLevel}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-slate-700">{trajectory.prediction}</p>
      <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{trajectory.advice}</p>
    </Card>
  );
}

function directionIcon(direction: Trajectory["direction"]) {
  if (direction === "improving") return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  if (direction === "declining") return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <ArrowRight className="h-4 w-4 text-slate-500" />;
}
