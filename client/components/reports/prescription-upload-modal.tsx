"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ExtractedMedicine = {
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
};

type ExtractionResult = {
  medications: ExtractedMedicine[];
  extractionNote?: string;
  extractedCount?: number;
};

type Props = {
  /** Called when the user has confirmed the list — passes back the extracted medicines */
  onExtracted: (medicines: ExtractedMedicine[], prescriptionRecordId?: string) => void;
  onCancel: () => void;
};

type Phase = "idle" | "uploading" | "done" | "error";

export function PrescriptionUploadModal({ onExtracted, onCancel }: Props) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // -----------------------------------------------------------------------
  // File handling
  // -----------------------------------------------------------------------
  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPhase("idle");
    setResult(null);
    setErrorMessage("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  // -----------------------------------------------------------------------
  // Upload → extraction
  // -----------------------------------------------------------------------
  async function extract() {
    if (!selectedFile || !process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;

    setPhase("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Extraction failed. Please try again.");
      }
      setResult(payload as ExtractionResult);
      setPhase("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Extraction failed. Please try again.");
      setPhase("error");
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close prescription upload"
      />
      <Card className="relative z-10 w-full max-w-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Step 1 of 3</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-slate-950">Upload Prescription</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload the prescription image or PDF. The AI will extract medicines for you to verify.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Drop zone */}
          {phase !== "done" && (
            <label
              id="prescription-drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragging
                  ? "border-brand-400 bg-brand-50"
                  : selectedFile
                    ? "border-brand-300 bg-brand-50/50"
                    : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {selectedFile ? (
                <>
                  <FileUp className="h-8 w-8 text-brand-600" />
                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  <p className="text-xs text-brand-600">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-300" />
                  <p className="font-medium text-slate-700">Drop prescription here or click to browse</p>
                  <p className="text-sm text-slate-400">PDF, JPG, or PNG — up to 10 MB</p>
                </>
              )}
            </label>
          )}

          {/* Extraction result preview */}
          {phase === "done" && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {result.extractedCount ?? result.medications.length} medicine(s) extracted — please verify below before proceeding.
              </div>
              {result.extractionNote && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {result.extractionNote}
                </div>
              )}
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {result.medications.map((med, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="font-medium text-slate-900">{med.medicine_name || "Unknown medicine"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ") || "Details not extracted"}
                    </p>
                  </div>
                ))}
                {result.medications.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                    No medicines were detected. You can add them manually in the next step.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {phase !== "done" && (
              <Button
                onClick={extract}
                disabled={!selectedFile || phase === "uploading"}
                className="gap-2"
                id="btn-extract-prescription"
              >
                {phase === "uploading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting medicines…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Extract medicines
                  </>
                )}
              </Button>
            )}
            {phase === "done" && result && (
              <Button
                onClick={() => onExtracted(result.medications)}
                className="gap-2"
                id="btn-confirm-extraction"
              >
                <CheckCircle2 className="h-4 w-4" />
                Continue to confirm list
              </Button>
            )}
            {phase === "done" && (
              <Button
                variant="outline"
                onClick={() => { setPhase("idle"); setResult(null); setSelectedFile(null); }}
                id="btn-reupload-prescription"
              >
                Upload different file
              </Button>
            )}
            <Button variant="outline" onClick={onCancel} id="btn-cancel-upload">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
