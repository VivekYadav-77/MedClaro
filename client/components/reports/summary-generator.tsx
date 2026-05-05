"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FileDown, MessageCircleMore, ClipboardCopy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export function SummaryGenerator({
  reportId,
  initialSummary = "",
  initialQuestions = []
}: {
  reportId: string;
  initialSummary?: string;
  initialQuestions?: string[];
}) {
  const { data: session } = useSession();
  const [specialty, setSpecialty] = useState("general");
  const [summary, setSummary] = useState(initialSummary);
  const [questions, setQuestions] = useState(initialQuestions);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
      setMessage("Connect to the API to generate a doctor visit pre-brief.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ specialty }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ?? "Could not generate pre-brief.");
        return;
      }
      setSummary(data.summaryMarkdown ?? data.shareText ?? "");
      setQuestions(data.doctorQuestions ?? []);
      setMessage(data.message ?? null);
    } catch {
      setMessage("Could not generate pre-brief.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">Pre-appointment summary</h3>
          <p className="text-sm text-[#6b8292]">One-tap prep for doctor visits, sharing, and quick printouts.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Select value={specialty} onChange={(event) => setSpecialty(event.target.value)} aria-label="Doctor specialty">
            <option value="general">General</option>
            <option value="cardiology">Cardiology</option>
            <option value="endocrinology">Endocrinology</option>
            <option value="nephrology">Nephrology</option>
            <option value="hematology">Hematology</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void generate()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate
          </Button>
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
      {message ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p> : null}
      <div className="rounded-[28px] bg-foam p-5">
        <p className="whitespace-pre-line text-sm leading-7 text-[#355166]">
          {summary || "Choose a specialty and generate a focused pre-brief before your appointment."}
        </p>
      </div>
      {questions.length ? <div>
        <p className="text-sm font-semibold text-ink">Questions to ask your doctor</p>
        <ul className="mt-3 space-y-2 text-sm text-[#355166]">
          {questions.map((question) => (
            <li key={question} className="rounded-2xl bg-white px-4 py-3">
              {question}
            </li>
          ))}
        </ul>
      </div> : null}
    </Card>
  );
}
