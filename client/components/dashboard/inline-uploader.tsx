"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { UploadProgress } from "@/components/dashboard/upload-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Report } from "@/lib/types";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export function InlineUploader({
  onUploaded,
  onViewReport,
  onProcessingChange
}: {
  onUploaded: (report: Report) => void;
  onViewReport: (report: Report) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
}) {
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedReport, setUploadedReport] = useState<Report | null>(null);

  const busy = currentStep >= 0 && !done;

  const selectFile = useCallback((nextFile?: File) => {
    if (!nextFile) return;
    setUploadedReport(null);
    setDone(false);
    setCurrentStep(-1);
    setError(null);

    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setFile(null);
      setError("Choose a PDF, JPG, or PNG report.");
      return;
    }
    if (nextFile.size > MAX_SIZE) {
      setFile(null);
      setError("Choose a file under 10 MB.");
      return;
    }
    setFile(nextFile);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      selectFile(event.dataTransfer.files[0]);
    },
    [selectFile]
  );

  const completeMockUpload = async (selectedFile: File) => {
    await wait(2600);
    return buildMockReport(selectedFile);
  };

  const upload = async () => {
    if (!file || busy) return;

    setError(null);
    setDone(false);
    setUploadedReport(null);
    setCurrentStep(0);
    onProcessingChange?.(true);

    const progressTimers: number[] = [];

    try {
      progressTimers.push(
        window.setTimeout(() => setCurrentStep(1), 650),
        window.setTimeout(() => setCurrentStep(2), 2600)
      );

      const report = process.env.NEXT_PUBLIC_API_URL
        ? await uploadToApi(file, session?.accessToken)
        : await completeMockUpload(file);

      progressTimers.forEach((timer) => window.clearTimeout(timer));
      setCurrentStep(3);
      setDone(true);
      setUploadedReport(report);
      onUploaded(report);
    } catch (uploadError) {
      progressTimers.forEach((timer) => window.clearTimeout(timer));
      setCurrentStep(-1);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      onProcessingChange?.(false);
    }
  };

  const reset = () => {
    setFile(null);
    setCurrentStep(-1);
    setDone(false);
    setError(null);
    setUploadedReport(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className="overflow-hidden border-brand-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Inline Upload</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">Analyze a report from the dashboard</h2>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Signed storage ready
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all ${
          dragging
            ? "border-brand-400 bg-brand-50"
            : file
              ? "border-teal-300 bg-teal-50/70"
              : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
        }`}
      >
        {file ? (
          <>
            <FileText className="mb-3 h-10 w-10 text-teal-500" />
            <p className="max-w-full break-words font-semibold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"
              aria-label="Clear selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <CloudUpload className="mb-4 h-12 w-12 text-slate-400" />
            <p className="font-display text-lg font-semibold text-slate-900">Drop your report here</p>
            <p className="mt-1 text-sm text-slate-500">PDF, JPG, or PNG up to 10 MB</p>
            <Button variant="outline" className="mt-5" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(event) => selectFile(event.target.files?.[0])}
          className="sr-only"
        />
      </div>

      {error ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Button variant="outline" size="sm" onClick={upload} disabled={!file || busy}>
            Try Again
          </Button>
        </div>
      ) : null}

      {currentStep >= 0 ? (
        <div className="mt-5">
          <UploadProgress currentStep={currentStep} done={done} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {done && uploadedReport ? (
          <>
            <Button className="flex-1 gap-2" onClick={() => onViewReport(uploadedReport)}>
              <CheckCircle2 className="h-4 w-4" />
              View Current Analysis
            </Button>
            <Button variant="outline" onClick={reset}>
              Upload another
            </Button>
          </>
        ) : (
          <Button className="flex-1 gap-2" onClick={upload} disabled={!file || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            {busy ? "Processing..." : "Analyze report"}
          </Button>
        )}
      </div>
    </Card>
  );
}

async function uploadToApi(file: File, accessToken?: string): Promise<Report> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("Missing API URL.");
  }

  const formData = new FormData();
  formData.append("file", file);
  const familyMemberId = window.localStorage.getItem("selectedFamilyMemberId");
  if (familyMemberId) {
    formData.append("familyMemberId", familyMemberId);
  }
  const circleId = window.localStorage.getItem("selectedCircleId");
  if (circleId) {
    formData.append("circleId", circleId);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/upload`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? payload?.detail?.error ?? "Upload failed.");
  }

  return response.json() as Promise<Report>;
}

function buildMockReport(file: File): Report {
  const now = new Date().toISOString();

  return {
    _id: `local-${Date.now()}`,
    reportType: file.type === "application/pdf" ? "blood_test" : "prescription",
    reportDate: now,
    uploadDate: now,
    labName: "Inline Upload Preview",
    fileRef: file.name,
    language: "en",
    structuredData: [
      {
        testName: "Hemoglobin",
        value: 12.4,
        unit: "g/dL",
        normalizedValue: 12.4,
        normalizedUnit: "g/dL",
        referenceRangeLow: 13.5,
        referenceRangeHigh: 17.5,
        flag: "low"
      },
      {
        testName: "Vitamin B12",
        value: 410,
        unit: "pg/mL",
        normalizedValue: 302.49,
        normalizedUnit: "pmol/L",
        referenceRangeLow: 200,
        referenceRangeHigh: 900,
        flag: "normal"
      }
    ],
    aiExplanation: {
      parameterLevel: [
        {
          parameter: "Hemoglobin",
          explanation: "This value is slightly below the reference range and may be worth reviewing with your clinician in context.",
          confidence: "Preview confidence"
        }
      ],
      holisticSummary:
        "This inline preview confirms the dashboard flow. Connect the API to replace the preview with the saved parsed analysis.",
      attentionScore: 2,
      confidenceNote: "Mock mode is active because NEXT_PUBLIC_API_URL is not configured.",
      disclaimer: "This preview is not medical advice."
    },
    medications: [],
    chatHistory: []
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
