"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, SendHorizontal, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, Circle } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function GlobalChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState<string>("");

  useEffect(() => {
    if (!API_URL || !session?.accessToken) return;
    const storedCircleId = window.localStorage.getItem("selectedCircleId") ?? "";
    setCircleId(storedCircleId);
    fetch(`${API_URL}/circles`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Circle[]) => {
        setCircles(data);
        if (storedCircleId && !data.some((circle) => circle.id === storedCircleId)) {
          window.localStorage.removeItem("selectedCircleId");
          setCircleId("");
        }
      })
      .catch(() => setCircles([]));
  }, [session?.accessToken]);

  async function sendMessage() {
    const message = draft.trim();
    if (!message || loading) return;
    if (!API_URL || !session?.accessToken) {
      setApiError("Assistant is unavailable until you are connected to the API.");
      return;
    }
    const userMessage: ChatMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${API_URL}/reports/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ message, ...(circleId ? { circleId } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Chat failed");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data?.message ?? "I could not answer from your reports.", timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <section className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-dialog">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h2 className="font-semibold text-slate-900">Your Health Assistant</h2>
              <p className="text-xs text-slate-500">Answers from your saved reports.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.role === "assistant" ? "bg-slate-100 text-slate-800" : "ml-auto bg-brand-600 text-white"
                }`}
              >
                {message.content}
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-slate-500">Ask about patterns across your reports.</p> : null}
          </div>
          <div className="space-y-2 border-t border-slate-100 p-4">
            {apiError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{apiError}</p> : null}
            {circles.length ? (
              <Select
                value={circleId}
                onChange={(event) => {
                  const nextCircleId = event.target.value;
                  setCircleId(nextCircleId);
                  if (nextCircleId) {
                    window.localStorage.setItem("selectedCircleId", nextCircleId);
                  } else {
                    window.localStorage.removeItem("selectedCircleId");
                  }
                }}
                aria-label="Assistant context"
              >
                <option value="">My reports only</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a health history question..." />
            <Button className="w-full gap-2" onClick={() => void sendMessage()} disabled={loading || !draft.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              Send
            </Button>
          </div>
        </section>
      ) : null}
      <Button className="fixed bottom-6 right-4 z-50 h-12 gap-2 rounded-full px-5 shadow-dialog" onClick={() => setOpen((value) => !value)}>
        <MessageCircle className="h-5 w-5" />
        Ask MedClaro
      </Button>
    </>
  );
}
