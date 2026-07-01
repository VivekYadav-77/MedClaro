"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { AccessibilityMode, FrontendPreferences, LanguageCode } from "@/lib/types";

const STORAGE_KEY = "projecthealth.frontendPreferences";

type PreferencesContextValue = {
  preferences: FrontendPreferences;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  setReducedMotion: (value: boolean) => void;
  setPreferredLanguage: (language: LanguageCode) => void;
};

const defaultPreferences: FrontendPreferences = {
  accessibilityMode: "standard",
  reducedMotion: false,
  preferredLanguage: "en",
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AccessibilityPreferencesProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: LanguageCode;
}) {
  const [preferences, setPreferences] = useState<FrontendPreferences>({
    ...defaultPreferences,
    preferredLanguage: locale,
  });

  useEffect(() => {
    const saved = readSavedPreferences();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPreferences({
      ...defaultPreferences,
      ...saved,
      preferredLanguage: saved?.preferredLanguage ?? locale,
      reducedMotion: saved?.reducedMotion ?? reducedMotion,
    });
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("easy-mode", preferences.accessibilityMode === "easy");
    document.documentElement.classList.toggle("reduce-motion", preferences.reducedMotion);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setAccessibilityMode: (mode) => setPreferences((current) => ({ ...current, accessibilityMode: mode })),
      setReducedMotion: (nextValue) => setPreferences((current) => ({ ...current, reducedMotion: nextValue })),
      setPreferredLanguage: (language) => setPreferences((current) => ({ ...current, preferredLanguage: language })),
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAccessibilityPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useAccessibilityPreferences must be used inside AccessibilityPreferencesProvider.");
  }
  return context;
}

function readSavedPreferences(): Partial<FrontendPreferences> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
