"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  "Uploading",
  "Extracting PDF Data",
  "AI Analysis in Progress",
  "Ready"
] as const;

export type UploadStep = (typeof STEPS)[number];

export function UploadProgress({
  currentStep,
  done
}: {
  currentStep: number;
  done: boolean;
}) {
  const progress = done ? 100 : Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {done ? "Analysis complete" : STEPS[Math.max(currentStep, 0)]}
        </span>
        <span className="text-slate-500">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 via-teal-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((step, index) => {
          const stepDone = done || index < currentStep;
          const active = index === currentStep && !done;

          return (
            <div
              key={step}
              className={`flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                stepDone
                  ? "bg-teal-50 text-teal-700"
                  : active
                    ? "bg-brand-50 text-brand-700"
                    : "bg-slate-50 text-slate-400"
              }`}
            >
              {stepDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
              ) : (
                <span className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className="leading-snug">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
