"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/lib/types";

export function ChatPanel({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Ask my report</h3>
        <p className="text-sm text-[#6b8292]">The assistant only answers questions grounded in your uploaded report values.</p>
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
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about a value or trend in this report..." />
        <Button
          className="w-full gap-2"
          onClick={() => {
            if (!draft.trim()) {
              return;
            }
            setMessages((current) => [
              ...current,
              { role: "user", content: draft, timestamp: new Date().toISOString() },
              {
                role: "assistant",
                content: "Based on your hemoglobin of 11.2 g/dL, this question is still tied to the lower-iron pattern already seen in the report.",
                timestamp: new Date().toISOString()
              }
            ]);
            setDraft("");
          }}
        >
          <SendHorizontal className="h-4 w-4" />
          Send question
        </Button>
      </div>
    </Card>
  );
}
