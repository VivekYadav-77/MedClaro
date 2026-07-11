"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  Eye,
  Languages,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  ShieldCheck,
  Volume2
} from "lucide-react";

type Preference = {
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
};

type AccessibilityPlan = {
  supported_languages: Array<{ code: string; name: string; status: string }>;
  translation_workflow: {
    model: string;
    prompt_version: string;
    quality_checks: string[];
  };
  voice_workflow: {
    read_aloud_targets: string[];
  };
  senior_mode_rules: Record<string, string>;
  fallback_language: string;
};

type SimplifiedDashboard = {
  mode: string;
  language: string;
  text_size: string;
  one_click_actions: string[];
  primary_cards: Array<{ title: string; value: string | number; detail: string }>;
  important_actions: Array<{ label: string; href: string }>;
};

type LocalizedArtifact = {
  id: number;
  source_type: string;
  language: string;
  original_text: string;
  localized_text: string;
  quality_checks: string[];
  model_name: string;
};

type VoiceArtifact = {
  id: number;
  voice_type: string;
  language: string;
  script_text: string;
  provider_status: string;
  provider_metadata: Record<string, unknown>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function AccessibilityPage() {
  const [token, setToken] = useState("");
  const [preference, setPreference] = useState<Preference | null>(null);
  const [plan, setPlan] = useState<AccessibilityPlan | null>(null);
  const [dashboard, setDashboard] = useState<SimplifiedDashboard | null>(null);
  const [localized, setLocalized] = useState<LocalizedArtifact[]>([]);
  const [voice, setVoice] = useState<VoiceArtifact[]>([]);
  const [sampleText, setSampleText] = useState("Your latest report has items to discuss with your doctor.");
  const [voiceText, setVoiceText] = useState("Here is a short, clear health summary.");
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

  async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...options.headers
      }
    });
    if (!response.ok) {
      throw new Error("Request failed");
    }
    return response.json() as Promise<T>;
  }

  async function loadAll() {
    setStatus("loading");
    try {
      const [prefData, planData, dashboardData, localizedData, voiceData] =
        await Promise.all([
          apiFetch<Preference>("/accessibility/preferences/"),
          apiFetch<AccessibilityPlan>("/accessibility/plan/"),
          apiFetch<SimplifiedDashboard>("/accessibility/simplified-dashboard/"),
          apiFetch<LocalizedArtifact[]>("/accessibility/localized-content/"),
          apiFetch<VoiceArtifact[]>("/accessibility/voice-summaries/")
        ]);
      setPreference(prefData);
      setPlan(planData);
      setDashboard(dashboardData);
      setLocalized(localizedData);
      setVoice(voiceData);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preference) {
      return;
    }
    setStatus("loading");
    try {
      await apiFetch<Preference>("/accessibility/preferences/", {
        method: "PATCH",
        body: JSON.stringify(preference)
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createLocalization() {
    setStatus("loading");
    try {
      await apiFetch<LocalizedArtifact>("/accessibility/localized-content/", {
        method: "POST",
        body: JSON.stringify({
          source_type: "assistant",
          language: preference?.preferred_language ?? "en",
          original_text: sampleText,
          literacy_level: "simple"
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createVoiceSummary() {
    setStatus("loading");
    try {
      await apiFetch<VoiceArtifact>("/accessibility/voice-summaries/", {
        method: "POST",
        body: JSON.stringify({
          voice_type: "assistant_response",
          language: preference?.preferred_language ?? "en",
          script_text: voiceText
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
                Accessibility
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Language, Voice, And Senior Mode
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Set preferred language, simplify the dashboard, plan read-aloud
                summaries, and preserve medical translation quality checks.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                English fallback
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Medical terms, numbers, units, and warning severity are preserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">Access</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              API token
              <input
                className={inputClass}
                placeholder="Paste token from registration/login"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </label>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="button"
              onClick={loadAll}
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Load
            </button>
            {status === "error" ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check token and required fields.
              </p>
            ) : null}
          </section>

          {preference ? (
            <form
              className="rounded-md border border-slate-200 bg-white p-5"
              onSubmit={savePreferences}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Preferences
                </h2>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Preferred language
                <select
                  className={inputClass}
                  value={preference.preferred_language}
                  onChange={(event) =>
                    setPreference({ ...preference, preferred_language: event.target.value })
                  }
                >
                  {plan?.supported_languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Text size
                <select
                  className={inputClass}
                  value={preference.large_text}
                  onChange={(event) =>
                    setPreference({ ...preference, large_text: event.target.value })
                  }
                >
                  <option value="standard">Standard</option>
                  <option value="large">Large</option>
                  <option value="extra_large">Extra large</option>
                </select>
              </label>
              <Toggle
                label="Senior mode"
                checked={preference.senior_mode}
                onChange={(checked) => setPreference({ ...preference, senior_mode: checked })}
              />
              <Toggle
                label="Simplified dashboard"
                checked={preference.simplified_dashboard}
                onChange={(checked) =>
                  setPreference({ ...preference, simplified_dashboard: checked })
                }
              />
              <Toggle
                label="High contrast"
                checked={preference.high_contrast}
                onChange={(checked) => setPreference({ ...preference, high_contrast: checked })}
              />
              <Toggle
                label="Voice summaries"
                checked={preference.voice_summaries}
                onChange={(checked) => setPreference({ ...preference, voice_summaries: checked })}
              />
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </form>
          ) : null}
        </aside>

        <section className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Multilingual Strategy
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {plan?.supported_languages.map((language) => (
                <div className="rounded-md border border-slate-200 p-3" key={language.code}>
                  <p className="font-semibold text-claro-ink">{language.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{language.status}</p>
                </div>
              )) ?? <Empty text="Load preferences to view language roadmap." />}
            </div>
            {plan ? (
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  {plan.translation_workflow.model} - {plan.translation_workflow.prompt_version}
                </p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  {plan.translation_workflow.quality_checks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Simplified Dashboard Preview
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {dashboard?.primary_cards.map((card) => (
                <div className="rounded-md border border-slate-200 p-4" key={card.title}>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-claro-ink">{card.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.detail}</p>
                </div>
              )) ?? <Empty text="No simplified dashboard loaded yet." />}
            </div>
            {dashboard ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {dashboard.important_actions.map((action) => (
                  <span
                    className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                    key={action.href}
                  >
                    {action.label}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Translation Draft
                </h2>
              </div>
              <textarea
                className={inputClass}
                rows={4}
                value={sampleText}
                onChange={(event) => setSampleText(event.target.value)}
              />
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={createLocalization}
              >
                Create Draft
              </button>
              <div className="mt-4 space-y-3">
                {localized.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <p className="text-sm font-semibold text-claro-ink">
                      {item.source_type} - {item.language}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.localized_text}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Voice Summary Plan
                </h2>
              </div>
              <textarea
                className={inputClass}
                rows={4}
                value={voiceText}
                onChange={(event) => setVoiceText(event.target.value)}
              />
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={createVoiceSummary}
              >
                <Mic className="h-4 w-4" />
                Plan Voice
              </button>
              <div className="mt-4 space-y-3">
                {voice.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <p className="text-sm font-semibold text-claro-ink">
                      {item.voice_type} - {item.provider_status}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.script_text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-4 flex items-center justify-between gap-4 text-sm font-medium text-slate-700">
      {label}
      <input
        checked={checked}
        className="h-4 w-4"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
      {text}
    </p>
  );
}
