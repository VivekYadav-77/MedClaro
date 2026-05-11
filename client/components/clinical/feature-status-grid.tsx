import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClinicalFeatureCard, FeatureStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { featureIcons, statusClasses, statusLabels } from "@/lib/clinical-features";

const statusVariant: Record<FeatureStatus, "success" | "warning" | "default" | "brand"> = {
  live: "success",
  needs_setup: "warning",
  backend_pending: "default",
  no_data: "brand",
};

export function FeatureStatusGrid({
  features,
  title = "Feature readiness",
}: {
  features: ClinicalFeatureCard[];
  title?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">Every roadmap capability is visible with an honest implementation state.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["live", "needs_setup", "backend_pending", "no_data"] as FeatureStatus[]).map((status) => (
            <span key={status} className={cn("rounded-md border px-2 py-1 text-xs font-semibold", statusClasses[status])}>
              {statusLabels[status]}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = featureIcons[feature.id] ?? fallbackIcon;
          const content = <FeatureCardContent feature={feature} icon={Icon} />;
          return feature.route ? (
            <Link key={feature.id} href={feature.route} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              {content}
            </Link>
          ) : (
            <div key={feature.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

function FeatureCardContent({
  feature,
  icon: Icon,
}: {
  feature: ClinicalFeatureCard;
  icon: LucideIcon;
}) {
  return (
    <Card className="h-full p-4 shadow-none transition-colors hover:border-brand-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{feature.shortTitle}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{feature.description}</p>
          </div>
        </div>
        <Badge variant={statusVariant[feature.status]}>{statusLabels[feature.status]}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="capitalize text-slate-500">{feature.category}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
          {feature.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}

const fallbackIcon = ArrowRight;
