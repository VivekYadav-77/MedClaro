import { Card } from "@/components/ui/card";
import { UploadWorkflow } from "@/components/reports/upload-workflow";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <Card className="space-y-3 bg-white/90">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Upload report</p>
        <h1 className="font-display text-4xl text-ink">Bring in blood reports, prescriptions, scans, or follow-up checks.</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#355166]">
          The server validates MIME type and true file type, limits files to 10MB, strips PII before AI analysis, and keeps stored files behind signed URLs only.
        </p>
      </Card>
      <UploadWorkflow />
    </div>
  );
}
