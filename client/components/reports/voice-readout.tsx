"use client";

import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VoiceReadout({ text, language }: { text: string; language: string }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleReadout = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  return (
    <Button
      variant="soft"
      size="lg"
      className="w-full justify-center gap-2"
      onClick={toggleReadout}
    >
      {playing ? <Square className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      {playing ? "Stop reading" : "Read to me"}
    </Button>
  );
}
