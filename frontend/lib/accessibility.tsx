"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";

export type AccessibilityPreference = {
  id?: number;
  preferred_language: string;
  fallback_language: string;
  senior_mode: boolean;
  simplified_dashboard: boolean;
  large_text: string;
  high_contrast: boolean;
  reduce_motion: boolean;
  voice_summaries: boolean;
  read_aloud_reports: boolean;
  assistant_voice_input: boolean;
  one_click_actions: string[];
  localization_notes?: string[];
  created_at?: string;
  updated_at?: string;
};

type AccessibilityContextValue = {
  preference: AccessibilityPreference;
  isLoading: boolean;
  error: string;
  reload: () => Promise<void>;
  updatePreference: (patch: Partial<AccessibilityPreference>) => Promise<void>;
};

const defaultPreference: AccessibilityPreference = {
  preferred_language: "en",
  fallback_language: "en",
  senior_mode: false,
  simplified_dashboard: false,
  large_text: "standard",
  high_contrast: false,
  reduce_motion: false,
  voice_summaries: false,
  read_aloud_reports: false,
  assistant_voice_input: false,
  one_click_actions: ["open_hub", "emergency_profile", "read_latest_report"],
  localization_notes: []
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { isReady, isSignedIn, token } = useSession();
  const [preference, setPreference] = useState<AccessibilityPreference>(defaultPreference);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const applyPreference = useCallback((nextPreference: AccessibilityPreference) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.contrast = nextPreference.high_contrast ? "high" : "standard";
    root.dataset.seniorMode = nextPreference.senior_mode ? "true" : "false";
    root.dataset.textSize = nextPreference.large_text;
    root.dataset.reduceMotion = nextPreference.reduce_motion ? "true" : "false";
    root.lang = nextPreference.preferred_language || "en";
  }, []);

  const reload = useCallback(async () => {
    if (!isReady || !isSignedIn) {
      setPreference(defaultPreference);
      applyPreference(defaultPreference);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await apiGet<AccessibilityPreference>("/accessibility/preferences/", token);
      setPreference(data);
      applyPreference(data);
    } catch {
      setError("Could not load accessibility preferences.");
    } finally {
      setIsLoading(false);
    }
  }, [applyPreference, isReady, isSignedIn, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updatePreference = useCallback(
    async (patch: Partial<AccessibilityPreference>) => {
      const nextPreference = { ...preference, ...patch };
      setPreference(nextPreference);
      applyPreference(nextPreference);
      if (!isSignedIn) return;
      setIsLoading(true);
      setError("");
      try {
        const saved = await apiJson<AccessibilityPreference>("/accessibility/preferences/", {
          method: "PATCH",
          token,
          body: patch
        });
        setPreference(saved);
        applyPreference(saved);
      } catch {
        setError("Could not save accessibility preferences.");
        setPreference(preference);
        applyPreference(preference);
      } finally {
        setIsLoading(false);
      }
    },
    [applyPreference, isSignedIn, preference, token]
  );

  const value = useMemo(
    () => ({ preference, isLoading, error, reload, updatePreference }),
    [error, isLoading, preference, reload, updatePreference]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibilityPreferences must be used inside AccessibilityProvider");
  }
  return context;
}
