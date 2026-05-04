"use client";

import { useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/lib/types";

export function ChatPanel({
  reportId,
  language,
  initialMessages
}: {
  reportId: string;
  language: string;
  initialMessages: ChatMessage[];
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || loading) return;

    if (!process.env.NEXT_PUBLIC_API_URL) {
      setApiError("Chat is unavailable until the API URL is configured.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...((session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : {})
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? payload?.detail?.error ?? "Chat failed");
      }

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? data.response ?? "I could not find a grounded answer in this report.",
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      setApiError("Could not reach assistant. Try again.");
      setMessages((current) => current.filter((message) => message !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Ask my report</h3>
        <p className="text-sm text-[#6b8292]">The assistant answers from this report in {language.toUpperCase()}.</p>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-[28px] bg-foam p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
              message.role === "assistant" ? "bg-white text-ink" : "ml-auto bg-ink text-white"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {apiError ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p> : null}
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Ask about a value or trend in this report..."
          disabled={loading}
        />
        <Button
          className="w-full gap-2"
          onClick={() => void sendMessage()}
          disabled={loading || !draft.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          {loading ? "Sending..." : "Send question"}
        </Button>
      </div>
    </Card>
  );
}
