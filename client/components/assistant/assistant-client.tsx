"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, FileText, Loader2, MessageSquareText, Pill, SendHorizontal, ShieldCheck, type LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, Circle, HealthContext } from "@/lib/types";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const suggestedQuestions = [
  "What changed most across my recent reports?",
  "Which markers should I ask my doctor about next?",
  "Do any medicines in my prescriptions need a safety review?",
  "Summarize this for a family caregiver in simple language.",
];

export function AssistantClient() {
  const { data: session } = useSession();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState("");
  const [context, setContext] = useState<HealthContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = session?.accessToken;
  const activeCircle = useMemo(() => circles.find((circle) => circle.id === circleId), [circleId, circles]);

  useEffect(() => {
    if (!API_URL || !token) return;
    const storedCircleId = window.localStorage.getItem("selectedCircleId") ?? "";
    setCircleId(storedCircleId);
    fetch(`${API_URL}/circles`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Circle[]) => {
        setCircles(data);
        if (storedCircleId && !data.some((circle) => circle.id === storedCircleId)) {
          window.localStorage.removeItem("selectedCircleId");
          setCircleId("");
        }
      })
      .catch(() => setCircles([]));
  }, [token]);

  useEffect(() => {
    void loadContext(circleId);
  }, [circleId, token]);

  async function loadContext(nextCircleId: string) {
    if (!API_URL || !token) return;
    setContextLoading(true);
    setError(null);
    try {
      const suffix = nextCircleId ? `?circleId=${nextCircleId}` : "";
      const response = await fetch(`${API_URL}/reports/chat${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not load assistant context.");
      setContext(data.healthContext);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load assistant context.");
    } finally {
      setContextLoading(false);
    }
  }

  async function sendMessage(event?: FormEvent, override?: string) {
    event?.preventDefault();
    const message = (override ?? draft).trim();
    if (!message || loading) return;
    if (!API_URL || !token) {
      setError("Assistant is unavailable until the API is connected.");
      return;
    }

    setMessages((current) => [...current, { role: "user", content: message, timestamp: new Date().toISOString() }]);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/reports/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, ...(circleId ? { circleId } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Assistant could not answer.");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data?.message ?? "I could not answer from saved reports.", timestamp: new Date().toISOString() },
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Assistant could not answer.");
    } finally {
      setLoading(false);
    }
  }

  function changeCircle(nextCircleId: string) {
    setCircleId(nextCircleId);
    if (nextCircleId) {
      window.localStorage.setItem("selectedCircleId", nextCircleId);
    } else {
      window.localStorage.removeItem("selectedCircleId");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Omni-aware assistant</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-950">Ask across the last 5 reports, medicines, and shared-care context</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Answers stay grounded in the selected health context. Chronic-condition records are not connected yet, so the assistant will call out missing context.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <Select value={circleId} onChange={(event) => changeCircle(event.target.value)} aria-label="Assistant care circle context">
            <option value="">My private health context</option>
            {circles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="flex min-h-[640px] flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  {activeCircle ? `${activeCircle.name} assistant` : "Personal assistant"}
                </h2>
                <p className="text-sm text-slate-500">Ask specific questions. The safest answers cite saved data.</p>
              </div>
              <Badge className="bg-teal-50 text-teal-700">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Report-grounded
              </Badge>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5">
            {!messages.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => void sendMessage(undefined, question)}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-medium leading-6 text-slate-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                  message.role === "assistant" ? "bg-white text-slate-800" : "ml-auto bg-brand-600 text-white"
                )}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reviewing saved context...
              </div>
            ) : null}
          </div>

          <form onSubmit={(event) => void sendMessage(event)} className="space-y-3 border-t border-slate-100 bg-white p-4">
            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
            ) : null}
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about trends, medications, family history, or what to prepare for a doctor visit..."
              className="min-h-24"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!draft.trim() || loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </form>
        </Card>

        <aside className="space-y-4">
          <ContextStatCard icon={BrainCircuit} label="Reports in context" value={contextLoading ? "..." : String(context?.reportCount ?? 0)} />
          <ContextStatCard icon={Pill} label="Active or recent medicines" value={contextLoading ? "..." : String(context?.activeMedicationCount ?? 0)} />
          <ContextStatCard icon={AlertTriangle} label="Markers to watch" value={contextLoading ? "..." : String(context?.watchMarkerCount ?? 0)} />

          <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Health Context JSON Preview</h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Chronic conditions are not available in the frontend/API yet. Reports and medications below are live context inputs.
            </div>
            <div className="mt-4 space-y-3">
              {(context?.reports ?? []).slice(0, 5).map((report) => (
                <div key={`${report.type}-${report.date}-${report.owner}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-slate-900">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {report.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-500">{report.familyMember || report.owner || "Saved profile"} - {report.date}</p>
                    </div>
                    <Badge>{report.abnormalMarkers.length} flags</Badge>
                  </div>
                </div>
              ))}
              {!contextLoading && !context?.reports?.length ? (
                <p className="text-sm leading-6 text-slate-500">Upload reports or select a Care Circle to build assistant context.</p>
              ) : null}
            </div>
          </Card>

          <Card className="border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-none">
            <MessageSquareText className="mb-3 h-5 w-5" />
            The assistant is for understanding records and preparing better questions. It should not replace emergency care or clinical decisions.
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ContextStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-xs font-medium text-slate-500">{label}</span>
        <span className="font-display text-2xl font-bold text-slate-900">{value}</span>
      </span>
    </Card>
  );
}
