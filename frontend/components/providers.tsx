"use client";

import { SessionProvider } from "@/lib/session";
import { AccessibilityProvider } from "@/lib/accessibility";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </SessionProvider>
  );
}
