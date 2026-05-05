import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/reports/chat-panel";
import { MedicationCard } from "@/components/reports/medication-card";
import { SummaryGenerator } from "@/components/reports/summary-generator";
import { VoiceReadout } from "@/components/reports/voice-readout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getReport } from "@/lib/api";

export default async function ReportDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  const report = await getReport(id).catch(() => null);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">{report.reportType.replace("_", " ")}</p>
            <h1 className="mt-2 font-display text-4xl text-ink">{report.labName}</h1>
            <p className="mt-2 text-sm text-[#5b7686]">Report date: {new Date(report.reportDate).toLocaleDateString()}</p>
          </div>
          <Badge>Attention {report.aiExplanation.attentionScore}/5</Badge>
        </div>
        <div className="rounded-[28px] bg-mist p-5">
          <h2 className="font-semibold text-ink">Looking at your report as a whole...</h2>
          <p className="mt-3 text-sm leading-7 text-[#355166]">{report.aiExplanation.holisticSummary}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {report.aiExplanation.parameterLevel.map((item) => (
            <Card key={item.parameter} className="bg-white">
              <p className="font-semibold text-ink">{item.parameter}</p>
              <p className="mt-2 text-sm leading-7 text-[#355166]">{item.explanation}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[#6b8292]">{item.confidence}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-foam">
            <p className="font-semibold text-ink">Confidence note</p>
            <p className="mt-2 text-sm leading-7 text-[#355166]">{report.aiExplanation.confidenceNote}</p>
          </Card>
          <Card className="bg-foam">
            <p className="font-semibold text-ink">Report-specific disclaimer</p>
            <p className="mt-2 text-sm leading-7 text-[#355166]">{report.aiExplanation.disclaimer}</p>
          </Card>
        </div>
        <VoiceReadout text={`${report.aiExplanation.holisticSummary} ${report.aiExplanation.disclaimer}`} language={report.language} />
      </Card>

      {report.medications?.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-3xl text-ink">Prescription decoder</h2>
          <div className="grid gap-4">
            {report.medications.map((medication) => (
              <MedicationCard key={medication.name} medication={medication} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SummaryGenerator reportId={report._id} />
        <ChatPanel reportId={report._id} language={report.language} initialMessages={report.chatHistory} />
      </div>
    </div>
  );
}
