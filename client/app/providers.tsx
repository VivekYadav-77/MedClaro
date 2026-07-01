"use client";

import { ReactNode, useEffect, useRef } from "react";
import { SessionProvider, signOut } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";

import { AccessibilityPreferencesProvider } from "@/components/accessibility/accessibility-preferences";
import { LanguageCode } from "@/lib/types";
import { getMessages } from "@/lib/i18n";

function IdleLogout() {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}

export function Providers({
  children,
  locale
}: {
  children: ReactNode;
  locale: LanguageCode;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={getMessages(locale)}>
        <AccessibilityPreferencesProvider locale={locale}>
          <IdleLogout />
          {children}
        </AccessibilityPreferencesProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
