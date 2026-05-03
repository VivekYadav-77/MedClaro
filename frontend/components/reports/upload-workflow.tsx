"use client";

import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const steps = ["Uploading", "Extracting", "Analyzing", "Ready"];

export function UploadWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep]);

  return (
    <Card className="space-y-6">
      <div className="rounded-[28px] border border-dashed border-sea/40 bg-mist/70 p-8 text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-sea" />
        <h2 className="mt-4 font-display text-3xl text-ink">Drop your report here</h2>
        <p className="mt-2 text-sm text-[#5e7989]">PDF, JPG, or PNG up to 10MB. Files stay private and use signed access only.</p>
        <div className="mt-5 flex justify-center">
          <Button onClick={() => setCurrentStep((value) => Math.min(value + 1, steps.length - 1))}>Simulate upload step</Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-[#456171]">
          <span>{steps[currentStep]}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className={`rounded-2xl px-4 py-3 text-sm ${index <= currentStep ? "bg-white text-ink" : "bg-white/50 text-[#7a909e]"}`}>
              {step}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
