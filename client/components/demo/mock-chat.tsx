"use client";

import { useMemo, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";

import type { DemoLanguage } from "@/components/demo/demo-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const prompts = [
  {
    label: "Explain my lipid panel",
    answer: "Your total cholesterol is acceptable, but LDL is a little above target. MedClaro would suggest asking your doctor whether diet changes, exercise, or medication review is right for your risk profile."
  },
  {
    label: "What should I ask my doctor?",
    answer: "Ask whether the low ferritin explains fatigue, whether you need iron supplementation, and when to repeat hemoglobin after treatment."
  },
  {
    label: "Summarize for my family",
    answer: "The report shows a likely low-iron pattern. It is not an emergency in this demo, but it deserves a planned doctor conversation."
  }
];

const greeting: Record<DemoLanguage, string> = {
  en: "Choose a question to see how MedClaro keeps explanations calm and practical.",
  hi: "Ek question chuniye aur dekhiye MedClaro kaise simple jawab deta hai.",
  es: "Elige una pregunta para ver respuestas claras y tranquilas."
};

export function MockChat({ highContrast, language }: { highContrast: boolean; language: DemoLanguage }) {
  const [selected, setSelected] = useState(0);
  const messages = useMemo(
    () => [
      { role: "assistant", text: greeting[language] },
      { role: "user", text: prompts[selected].label },
      { role: "assistant", text: prompts[selected].answer }
    ],
    [language, selected]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-2">
        {prompts.map((prompt, index) => (
          <Button
            key={prompt.label}
            variant={selected === index ? "soft" : "outline"}
            className="h-auto w-full justify-start whitespace-normal rounded-lg py-3 text-left"
            onClick={() => setSelected(index)}
          >
            {prompt.label}
          </Button>
        ))}
      </div>
      <div className={cn("rounded-lg border border-slate-200 bg-slate-50 p-4", highContrast && "border-white/20 bg-slate-800")}>
        <div className="space-y-3">
          {messages.map((message, index) => {
            const assistant = message.role === "assistant";
            return (
              <div key={`${message.role}-${index}`} className={cn("flex gap-3", !assistant && "justify-end")}>
                {assistant && <Bot className="mt-2 h-5 w-5 shrink-0 text-brand-600" />}
                <div
                  className={cn(
                    "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6",
                    assistant ? "bg-white text-slate-700" : "bg-brand-600 text-white",
                    highContrast && assistant && "bg-slate-950 text-slate-100"
                  )}
                >
                  {message.text}
                </div>
                {!assistant && <UserRound className="mt-2 h-5 w-5 shrink-0 text-brand-600" />}
              </div>
            );
          })}
        </div>
        <div className={cn("mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2", highContrast && "border-white/20 bg-slate-950")}>
          <span className="flex-1 px-2 text-sm text-slate-500">Ask with guided prompts in the live app</span>
          <Button size="icon" title="Send sample prompt">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
