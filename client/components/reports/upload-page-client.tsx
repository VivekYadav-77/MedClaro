"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Pill } from "lucide-react";

import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { Card } from "@/components/ui/card";
import { Report } from "@/lib/types";

export function UploadPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const isPrescription = type === "prescription";

  function handleUploaded(report: Report) {
    if (next === "medication-intake-report") {
      const params = new URLSearchParams();
      const prescriptionId = searchParams.get("prescriptionId");
      if (prescriptionId) params.set("prescriptionId", prescriptionId);
      params.set("selectedReportId", report._id);
      router.push(`/reports/medications/intake?${params.toString()}`);
      return;
    }
    if (isPrescription) {
      const params = new URLSearchParams({ prescriptionReportId: report._id });
      if (report.prescriptionRecordId) params.set("prescriptionId", report.prescriptionRecordId);
      router.push(next === "medication-intake" ? `/reports/medications/intake?${params.toString()}` : `/reports/medications/setup?${params.toString()}`);
      return;
    }
    if (next === "medication-risk" || next === "refills" || next === "generics") {
      router.push(`/reports/medications${next === "refills" ? "?tab=refills" : next === "generics" ? "?tab=generics" : ""}`);
      return;
    }
    router.push(`/reports/${report._id}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          {isPrescription ? "Upload Prescription" : "Upload Report"}
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          {isPrescription ? "Add a prescription for medication review" : "Add a blood report, prescription, or scan"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Files are validated for MIME type, limited to 10 MB, and analyzed through the connected report API when available.
        </p>
      </div>

      {isPrescription ? (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 shadow-none">
          <Pill className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-950">Prescription context</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              After upload, the medication center will connect extracted medicines with nearby analyzed reports for safer review.
              You will choose which current reports belong with this prescription before risk analysis runs.
            </p>
          </div>
        </Card>
      ) : null}

      <InlineUploader
        onUploaded={handleUploaded}
        onViewReport={(report) => router.push(`/reports/${report._id}`)}
        eyebrow={isPrescription ? "Prescription upload" : "Inline Upload"}
        title={isPrescription ? "Upload and save a prescription" : "Analyze a report from the dashboard"}
        dropTitle={isPrescription ? "Drop your prescription here" : "Drop your report here"}
        actionLabel={isPrescription ? "Save prescription" : "Analyze report"}
        doneLabel={isPrescription ? "Continue medication review" : "View Current Analysis"}
      />
    </div>
  );
}
