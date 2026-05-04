"use client";

import { useEffect } from "react";

export function MilestoneToast({
  message,
  onClose
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[70] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-dialog animate-slide-up">
      {message}
    </div>
  );
}
