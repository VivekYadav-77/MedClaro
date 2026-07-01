import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { RelatedAction } from "@/lib/journeys";
import { cn } from "@/lib/utils";

const toneClass = {
  brand: "bg-brand-50 text-brand-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-700",
};

export function RelatedActions({
  title = "Related next steps",
  actions,
}: {
  title?: string;
  actions: RelatedAction[];
}) {
  return (
    <section className="space-y-3" aria-labelledby="related-actions-title">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-slate-600">Connected ecosystem</p>
        <h2 id="related-actions-title" className="font-display text-2xl font-bold text-slate-950">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.title}`}
            href={action.href}
            className="group flex min-h-32 items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-card-hover"
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClass[action.tone ?? "brand"])}>
              <action.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-slate-950">{action.title}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-700">{action.body}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 group-hover:gap-2">
                Open <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function JourneyCallout({ action }: { action: RelatedAction }) {
  return (
    <BentoCard className="border-brand-100 bg-brand-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", toneClass[action.tone ?? "brand"])}>
            <action.icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Today’s next step</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">{action.title}</h2>
            <p className="mt-1 max-w-2xl text-base leading-7 text-slate-700">{action.body}</p>
          </div>
        </div>
        <Link href={action.href} className="inline-flex">
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-brand-700">
            Continue
          </span>
        </Link>
      </div>
    </BentoCard>
  );
}
