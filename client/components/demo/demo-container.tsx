"use client";

import { useMemo, useState } from "react";
import {
  Accessibility,
  Bell,
  FileText,
  Languages,
  LineChart,
  MessageCircle,
  Pill,
  UploadCloud,
  Users
} from "lucide-react";

import { MockAnalysis } from "@/components/demo/mock-analysis";
import { MockChat } from "@/components/demo/mock-chat";
import { MockPrescription } from "@/components/demo/mock-prescription";
import { MockSettingsBar } from "@/components/demo/mock-settings-bar";
import { MockTrends } from "@/components/demo/mock-trends";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DemoLanguage = "en" | "hi" | "es";
export type DemoProfile = "Self" | "Mom" | "Dad";

const steps = [
  {
    id: "upload",
    title: "Smart upload",
    icon: UploadCloud,
    body: "Simulate a report upload and watch it become a clear health summary."
  },
  {
    id: "chat",
    title: "Health chat",
    icon: MessageCircle,
    body: "Try guided questions that explain results in plain language."
  },
  {
    id: "trends",
    title: "Trend view",
    icon: LineChart,
    body: "See how biomarkers move over time against a normal range."
  },
  {
    id: "prescription",
    title: "Prescription decoding",
    icon: Pill,
    body: "Turn unclear instructions into a clean medication schedule."
  }
] as const;

type StepId = (typeof steps)[number]["id"];

const profileSummaries: Record<DemoProfile, string> = {
  Self: "Iron markers need a calm follow-up with your clinician.",
  Mom: "Thyroid and vitamin D checks are organized for the next visit.",
  Dad: "Glucose tracking and medicine timing are ready for review."
};

const copy: Record<DemoLanguage, { headline: string; subhead: string; status: string }> = {
  en: {
    headline: "Explore MedClaro with sample health data",
    subhead: "This page is a guided demo only. For real uploads, use guest mode or create an account.",
    status: "Demo data active"
  },
  hi: {
    headline: "Sample health data ke saath MedClaro dekhiye",
    subhead: "Yeh sirf guided demo hai. Real upload ke liye guest mode ya account use karein.",
    status: "Demo data active"
  },
  es: {
    headline: "Explora MedClaro con datos de salud de ejemplo",
    subhead: "Esta pagina es una demo guiada. Para cargas reales, usa modo invitado o crea una cuenta.",
    status: "Demo data active"
  }
};

export function DemoContainer() {
  const [activeStep, setActiveStep] = useState<StepId>("upload");
  const [language, setLanguage] = useState<DemoLanguage>("en");
  const [profile, setProfile] = useState<DemoProfile>("Self");
  const [highContrast, setHighContrast] = useState(false);

  const currentStep = useMemo(() => steps.find((step) => step.id === activeStep) ?? steps[0], [activeStep]);

  return (
    <section
      className={cn(
        "mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[320px_minmax(0,1fr)]",
        highContrast && "bg-slate-950 text-white"
      )}
    >
      <aside className={cn("rounded-lg border border-slate-200 bg-white p-4", highContrast && "border-white/20 bg-slate-900")}>
        <Badge variant="brand">{copy[language].status}</Badge>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight">{copy[language].headline}</h1>
        <p className={cn("mt-3 text-sm leading-6 text-slate-600", highContrast && "text-slate-200")}>
          {copy[language].subhead}
        </p>

        <div className="mt-6 space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const active = step.id === activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition",
                  active ? "border-brand-200 bg-brand-50 text-brand-900" : "hover:bg-slate-50",
                  highContrast && (active ? "border-white bg-white text-slate-950" : "hover:bg-slate-800")
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{step.title}</span>
                  <span className={cn("mt-1 block text-xs leading-5 text-slate-600", highContrast && !active && "text-slate-300")}>
                    {step.body}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={cn("mt-6 rounded-lg bg-slate-50 p-4 text-sm", highContrast && "bg-slate-800")}>
          <div className="flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4" />
            {profile}
          </div>
          <p className={cn("mt-2 leading-6 text-slate-600", highContrast && "text-slate-200")}>{profileSummaries[profile]}</p>
        </div>
      </aside>

      <div className={cn("min-w-0 rounded-lg border border-slate-200 bg-white", highContrast && "border-white/20 bg-slate-900")}>
        <MockSettingsBar
          highContrast={highContrast}
          language={language}
          profile={profile}
          onHighContrastChange={setHighContrast}
          onLanguageChange={setLanguage}
          onProfileChange={setProfile}
        />

        <div className="border-b border-slate-200 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={cn("text-xs font-semibold uppercase text-slate-500", highContrast && "text-slate-300")}>Current feature</p>
              <h2 className="font-display text-2xl font-bold">{currentStep.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(steps[Math.max(0, steps.findIndex((step) => step.id === activeStep) - 1)].id)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveStep(steps[Math.min(steps.length - 1, steps.findIndex((step) => step.id === activeStep) + 1)].id)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeStep === "upload" && <MockAnalysis highContrast={highContrast} language={language} profile={profile} />}
          {activeStep === "chat" && <MockChat highContrast={highContrast} language={language} />}
          {activeStep === "trends" && <MockTrends highContrast={highContrast} profile={profile} />}
          {activeStep === "prescription" && <MockPrescription highContrast={highContrast} />}

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              { icon: Users, label: "Family profiles" },
              { icon: Languages, label: "Multilingual UI" },
              { icon: Bell, label: "Smart reminders" },
              { icon: Accessibility, label: "High contrast" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className={cn("rounded-lg border border-slate-200 p-3 text-sm", highContrast && "border-white/20")}>
                <Icon className="h-4 w-4 text-brand-600" />
                <p className="mt-2 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
