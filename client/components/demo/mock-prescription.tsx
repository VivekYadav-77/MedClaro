"use client";

import { AlarmClock, CalendarCheck2, Pill } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const medicines = [
  { name: "Metformin", dose: "500 mg", time: "After breakfast and dinner", duration: "3 months" },
  { name: "Vitamin B12", dose: "1500 mcg", time: "Morning", duration: "30 days" },
  { name: "Iron", dose: "60 mg", time: "Evening, away from tea", duration: "8 weeks" }
];

export function MockPrescription({ highContrast }: { highContrast: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className={cn("rounded-lg border border-slate-200 bg-slate-50 p-5", highContrast && "border-white/20 bg-slate-800")}>
        <Badge variant="warning">Handwritten sample</Badge>
        <div className="mt-4 min-h-72 rounded-lg bg-white p-5 font-display text-slate-700 shadow-sm">
          <p className="rotate-[-2deg] text-2xl font-bold">Rx</p>
          <div className="mt-8 space-y-5 text-lg italic leading-8">
            <p className="rotate-[-1deg]">Tab Metf... 500 bd aft food</p>
            <p className="rotate-[1deg]">B12 1500 mcg od morn</p>
            <p className="rotate-[-1deg]">Iron 60 mg eve x 8 wk</p>
          </div>
        </div>
      </div>

      <div className={cn("rounded-lg border border-slate-200 p-5", highContrast && "border-white/20")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="success">Decoded schedule</Badge>
            <h3 className="mt-3 font-display text-2xl font-bold">Medication plan</h3>
          </div>
          <CalendarCheck2 className="h-8 w-8 text-brand-600" />
        </div>
        <div className="mt-5 space-y-3">
          {medicines.map((medicine) => (
            <div key={medicine.name} className={cn("grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto]", highContrast && "border-white/20")}>
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Pill className="h-4 w-4 text-teal-600" />
                  {medicine.name} {medicine.dose}
                </div>
                <p className={cn("mt-1 text-sm text-slate-600", highContrast && "text-slate-200")}>{medicine.time}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <AlarmClock className="h-4 w-4" />
                {medicine.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
