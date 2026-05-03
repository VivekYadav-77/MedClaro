"use client";

import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VoiceReadout({ text, language }: { text: string; language: string }) {
  return (
    <Button
      variant="soft"
      size="lg"
      className="w-full justify-center gap-2"
      onClick={() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }}
    >
      <Volume2 className="h-5 w-5" />
      Read to me
    </Button>
  );
}
