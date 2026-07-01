"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, CloudUpload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";

const STEPS = ["Choose file", "Upload safely", "Read result", "Ready"] as const;

export function UploadWorkflow() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = idle
  const [done, setDone] = useState(false);

  const progress = useMemo(
    () => (currentStep < 0 ? 0 : Math.round(((currentStep + 1) / STEPS.length) * 100)),
    [currentStep]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const simulateUpload = () => {
    if (!file || currentStep >= 0) return;
    setDone(false);
    let step = 0;
    setCurrentStep(0);
    const interval = setInterval(() => {
      step++;
      if (step >= STEPS.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      setCurrentStep(step);
    }, 900);
  };

  const reset = () => {
    setFile(null);
    setCurrentStep(-1);
    setDone(false);
  };

  return (
    <BentoCard className="p-6 space-y-6 bg-white/70 backdrop-blur-xl">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
          dragging
            ? "border-brand-400 bg-brand-50"
            : file
            ? "border-teal-400 bg-teal-50"
            : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
        }`}
      >
        {file ? (
          <>
            <FileText className="h-10 w-10 text-teal-500 mb-3" />
            <p className="font-semibold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={reset}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <CloudUpload className="h-12 w-12 text-slate-400 mb-4" />
            <h2 className="font-display text-2xl font-semibold text-slate-900">Choose your report</h2>
            <p className="mt-2 text-base text-slate-700">PDF, JPG, or PNG up to 10 MB. You may also drag and drop here.</p>
            <label className="mt-5 cursor-pointer">
              <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-base font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50">
                Choose file
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} className="sr-only" aria-label="Choose report file" />
            </label>
          </>
        )}
      </div>

      {/* Progress */}
      {currentStep >= 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {done ? "Analysis complete!" : STEPS[currentStep]}
            </span>
            <span className="text-slate-500">{done ? "100" : progress}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, i) => {
              const stepDone = done || i < currentStep;
              const active = i === currentStep && !done;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
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
                    <span className="h-3.5 w-3.5" />
                  )}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="flex gap-3">
        {done ? (
          <>
            <Button className="flex-1">View report analysis</Button>
            <Button variant="outline" onClick={reset}>Upload another</Button>
          </>
        ) : (
          <Button
            className="flex-1 gap-2"
            onClick={simulateUpload}
            disabled={!file || currentStep >= 0}
          >
            {currentStep >= 0 ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Reading report...</>
            ) : (
              <><CloudUpload className="h-4 w-4" /> Upload and explain</>
            )}
          </Button>
        )}
      </div>
    </BentoCard>
  );
}
