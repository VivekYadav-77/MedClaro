"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldAlert, UploadCloud } from "lucide-react";

import type { DemoLanguage, DemoProfile } from "@/components/demo/demo-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const labels: Record<DemoLanguage, { action: string; ready: string; title: string }> = {
  en: { action: "Simulate upload", ready: "Analysis ready", title: "CBC and iron panel" },
  hi: { action: "Upload simulate karein", ready: "Analysis ready", title: "CBC aur iron panel" },
  es: { action: "Simular carga", ready: "Analisis listo", title: "Hemograma y panel de hierro" }
};

const profileData: Record<DemoProfile, { score: number; summary: string; markers: Array<{ name: string; value: string; flag: string }> }> = {
  Self: {
    score: 72,
    summary: "Ferritin and hemoglobin are low together, so MedClaro marks this as worth a doctor follow-up.",
    markers: [
      { name: "Hemoglobin", value: "11.2 g/dL", flag: "Low" },
      { name: "Ferritin", value: "18 ng/mL", flag: "Low" },
      { name: "Vitamin B12", value: "250 pg/mL", flag: "Normal" }
    ]
  },
  Mom: {
    score: 81,
    summary: "Vitamin D is low and thyroid values are near the edge of the usual range.",
    markers: [
      { name: "Vitamin D", value: "18 ng/mL", flag: "Low" },
      { name: "TSH", value: "4.1 mIU/L", flag: "Review" },
      { name: "Calcium", value: "9.3 mg/dL", flag: "Normal" }
    ]
  },
  Dad: {
    score: 68,
    summary: "HbA1c is above target and the glucose trend needs steady monitoring.",
    markers: [
      { name: "HbA1c", value: "7.4%", flag: "High" },
      { name: "Fasting glucose", value: "142 mg/dL", flag: "High" },
      { name: "Creatinine", value: "1.0 mg/dL", flag: "Normal" }
    ]
  }
};

export function MockAnalysis({
  highContrast,
  language,
  profile
}: {
  highContrast: boolean;
  language: DemoLanguage;
  profile: DemoProfile;
}) {
  const [stage, setStage] = useState<"idle" | "processing" | "ready">("idle");
  const data = profileData[profile];

  const runDemo = () => {
    setStage("processing");
    window.setTimeout(() => setStage("ready"), 1100);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className={cn("rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5", highContrast && "border-white/30 bg-slate-800")}>
        <FileText className="h-10 w-10 text-brand-600" />
        <h3 className="mt-4 font-display text-xl font-bold">{labels[language].title}</h3>
        <p className={cn("mt-2 text-sm leading-6 text-slate-600", highContrast && "text-slate-200")}>
          Sample PDF, no real file selected. This demonstrates the flow; guest mode handles practical uploads.
        </p>
        <Button className="mt-5 w-full gap-2" onClick={runDemo} disabled={stage === "processing"}>
          {stage === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {stage === "processing" ? "Reading report" : labels[language].action}
        </Button>
      </div>

      <div className={cn("rounded-lg border border-slate-200 p-5", highContrast && "border-white/20")}>
        {stage === "idle" ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <UploadCloud className="h-10 w-10 text-slate-400" />
            <p className={cn("mt-3 text-sm text-slate-600", highContrast && "text-slate-200")}>Start the simulation to reveal the analysis state.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Badge variant={stage === "ready" ? "success" : "brand"}>{stage === "ready" ? labels[language].ready : "Extracting values"}</Badge>
                {stage === "ready" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
              <Progress value={stage === "ready" ? 100 : 64} className="mt-4" />
            </div>
            <div className={cn("rounded-lg bg-amber-50 p-4", highContrast && "bg-slate-800")}>
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                Attention score {data.score}/100
              </div>
              <p className={cn("mt-2 text-sm leading-6 text-slate-700", highContrast && "text-slate-100")}>{data.summary}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {data.markers.map((marker) => (
                <div key={marker.name} className={cn("rounded-lg border border-slate-200 p-3", highContrast && "border-white/20")}>
                  <p className="text-xs text-slate-500">{marker.name}</p>
                  <p className="mt-1 font-semibold">{marker.value}</p>
                  <Badge className="mt-2" variant={marker.flag === "Normal" ? "success" : marker.flag === "Review" ? "warning" : "danger"}>
                    {marker.flag}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
