import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UploadWorkflow } from "@/components/reports/upload-workflow";

export default function UploadPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Upload Report</p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Add a blood report, prescription, or scan
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Files are validated for MIME type, limited to 10 MB, and PII is stripped before AI analysis. Stored files use signed URLs only.
        </p>
      </div>

      <UploadWorkflow />
    </div>
  );
}
