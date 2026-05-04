"use client";

import { FileDown, MessageCircleMore, ClipboardCopy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SummaryGenerator({
  summary,
  questions
}: {
  summary: string;
  questions: string[];
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">Pre-appointment summary</h3>
          <p className="text-sm text-[#6b8292]">One-tap prep for doctor visits, sharing, and quick printouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm" onClick={() => window.print()}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="soft" size="sm" onClick={() => navigator.clipboard.writeText(summary)}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="soft"
            size="sm"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank", "noopener,noreferrer")}
          >
            <MessageCircleMore className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </div>
      <div className="rounded-[28px] bg-foam p-5">
        <p className="whitespace-pre-line text-sm leading-7 text-[#355166]">{summary}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">Questions to ask your doctor</p>
        <ul className="mt-3 space-y-2 text-sm text-[#355166]">
          {questions.map((question) => (
            <li key={question} className="rounded-2xl bg-white px-4 py-3">
              {question}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
