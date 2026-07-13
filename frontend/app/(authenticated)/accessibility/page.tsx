"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Gauge,
  Languages,
  Loader2,
  Mic,
  MousePointer2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Type,
  Volume2,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  FormField,
  InlineValidation,
  PageHeader,
  PermissionNotice,
  SafetyNotice,
  SectionHeader,
  StatusBadge,
  SuccessLine
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { AccessibilityPreference, useAccessibilityPreferences } from "@/lib/accessibility";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type AccessibilityPlan = {
  supported_languages: Array<{ code: string; name: string; status: string }>;
  translation_workflow: {
    model: string;
    prompt_version: string;
    source_policy: string;
    quality_checks: string[];
  };
  voice_workflow: {
    text_to_speech: string;
    speech_to_text: string;
    read_aloud_targets: string[];
  };
  senior_mode_rules: Record<string, string>;
  fallback_language: string;
};

type SimplifiedDashboard = {
  mode: string;
  language: string;
  text_size: string;
  high_contrast?: boolean;
  one_click_actions: string[];
  primary_cards: Array<{ title: string; value: string | number; detail: string }>;
  important_actions: Array<{ label: string; href: string }>;
  alerts?: Array<{ title: string; summary: string; severity: string }>;
};

type LocalizedArtifact = {
  id: number;
  source_type: string;
  language: string;
  fallback_language: string;
  original_text: string;
  localized_text: string;
  quality_checks: string[];
  model_name: string;
  prompt_version: string;
  created_at: string;
};

type VoiceArtifact = {
  id: number;
  voice_type: string;
  language: string;
  script_text: string;
  provider_status: string;
  provider_metadata: Record<string, unknown>;
  created_at: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

const oneClickOptions = [
  { value: "open_hub", label: "Open Health Hub" },
  { value: "emergency_profile", label: "Emergency Profile" },
  { value: "read_latest_report", label: "Read Latest Report" },
  { value: "medicine_reminders", label: "Medicine Reminders" },
  { value: "family_contact", label: "Family Contact" },
  { value: "ask_assistant", label: "Ask Assistant" }
];

const testingChecks = [
  "Keyboard-only navigation",
  "Screen-reader labels",
  "Focus order",
  "Color contrast",
  "Reduced motion",
  "High contrast mode",
  "Text zoom to 200%",
  "Mobile touch targets",
  "Chart alternatives"
];

export default function AccessibilityPage() {
  const router = useRouter();
  const { isReady, isSignedIn, token } = useSession();
  const { error: preferenceError, preference, reload, updatePreference } = useAccessibilityPreferences();
  const [plan, setPlan] = useState<AccessibilityPlan | null>(null);
  const [dashboard, setDashboard] = useState<SimplifiedDashboard | null>(null);
  const [localized, setLocalized] = useState<LocalizedArtifact[]>([]);
  const [voice, setVoice] = useState<VoiceArtifact[]>([]);
  const [sampleText, setSampleText] = useState("Your latest report has items to discuss with your doctor.");
  const [voiceText, setVoiceText] = useState("Here is a short, clear health summary.");
  const [voiceType, setVoiceType] = useState("assistant_response");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "loaded" | "error">("loading");
  const [message, setMessage] = useState("");

  const languageName = useMemo(
    () => plan?.supported_languages.find((language) => language.code === preference.preferred_language)?.name ?? "English",
    [plan, preference.preferred_language]
  );

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function loadAll() {
    setStatus("loading");
    setMessage("");
    try {
      await reload();
      const [planData, dashboardData, localizedData, voiceData] = await Promise.all([
        apiGet<AccessibilityPlan>("/accessibility/plan/", token),
        apiGet<SimplifiedDashboard>("/accessibility/simplified-dashboard/", token),
        apiGet<LocalizedArtifact[]>("/accessibility/localized-content/", token),
        apiGet<VoiceArtifact[]>("/accessibility/voice-summaries/", token)
      ]);
      setPlan(planData);
      setDashboard(dashboardData);
      setLocalized(localizedData);
      setVoice(voiceData);
      setStatus("loaded");
    } catch {
      setStatus("error");
      setMessage("Could not load accessibility settings. Check your session and try again.");
    }
  }

  async function savePatch(patch: Partial<AccessibilityPreference>, successMessage = "Preferences saved.") {
    setStatus("saving");
    setMessage("");
    try {
      await updatePreference(patch);
      const dashboardData = await apiGet<SimplifiedDashboard>("/accessibility/simplified-dashboard/", token);
      setDashboard(dashboardData);
      setStatus("loaded");
      setMessage(successMessage);
    } catch {
      setStatus("error");
      setMessage("Could not save preference changes.");
    }
  }

  async function createLocalization() {
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<LocalizedArtifact>("/accessibility/localized-content/", {
        method: "POST",
        token,
        body: {
          source_type: "assistant",
          language: preference.preferred_language,
          original_text: sampleText,
          literacy_level: preference.senior_mode ? "simple" : "standard"
        }
      });
      const localizedData = await apiGet<LocalizedArtifact[]>("/accessibility/localized-content/", token);
      setLocalized(localizedData);
      setStatus("loaded");
      setMessage("Translation draft created with medical preservation checks.");
    } catch {
      setStatus("error");
      setMessage("Could not create the translation draft.");
    }
  }

  async function createVoiceSummary() {
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<VoiceArtifact>("/accessibility/voice-summaries/", {
        method: "POST",
        token,
        body: {
          voice_type: voiceType,
          language: preference.preferred_language,
          script_text: voiceText
        }
      });
      const voiceData = await apiGet<VoiceArtifact[]>("/accessibility/voice-summaries/", token);
      setVoice(voiceData);
      setStatus("loaded");
      setMessage("Voice summary plan created.");
    } catch {
      setStatus("error");
      setMessage("Could not create the voice summary plan.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading accessibility settings" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <button className="min-h-11 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white" type="button" onClick={() => router.push("/signin")}>
              Sign in
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-claro-background">
      <PageHeader
        eyebrow="Access & Language"
        title="Accessibility Works Across MedClaro"
        description="Language, voice, high contrast, reduced motion, text size, Senior Mode, and one-click actions are global preferences, not page-only settings."
        actions={
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="button" onClick={loadAll}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          <PermissionNotice title="Global preference layer">
            Current mode: {preference.senior_mode ? "Senior Mode" : "Standard Mode"}, language {languageName}, text size {preference.large_text.replaceAll("_", " ")}.
          </PermissionNotice>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {status === "error" ? <InlineValidation>{message || preferenceError}</InlineValidation> : null}
        {message && status === "loaded" ? <SuccessLine>{message}</SuccessLine> : null}
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader icon={Eye} title="Preferences" description="These controls update document-level behavior and the app shell." />
            <div className="mt-5 space-y-4">
              <LanguageSelector
                fallbackLanguage={preference.fallback_language}
                languages={plan?.supported_languages ?? []}
                preferredLanguage={preference.preferred_language}
                onChange={(patch) => savePatch(patch, "Language preferences saved.")}
              />
              <TextSizeSelector value={preference.large_text} onChange={(large_text) => savePatch({ large_text })} />
              <SeniorModeToggle
                checked={preference.senior_mode}
                onChange={(senior_mode) =>
                  savePatch({
                    senior_mode,
                    simplified_dashboard: senior_mode ? true : preference.simplified_dashboard,
                    large_text: senior_mode && preference.large_text === "standard" ? "large" : preference.large_text
                  }, senior_mode ? "Senior Mode enabled." : "Senior Mode disabled.")
                }
              />
              <HighContrastToggle checked={preference.high_contrast} onChange={(high_contrast) => savePatch({ high_contrast })} />
              <ReduceMotionToggle checked={preference.reduce_motion} onChange={(reduce_motion) => savePatch({ reduce_motion })} />
            </div>
          </section>

          <OneClickActionEditor
            actions={preference.one_click_actions}
            onChange={(one_click_actions) => savePatch({ one_click_actions }, "One-click actions saved.")}
          />
        </aside>

        <section className="space-y-6">
          <SimplifiedDashboardPreview dashboard={dashboard} preference={preference} />

          <section className="grid gap-6 xl:grid-cols-2">
            <MultilingualPanel
              localized={localized}
              plan={plan}
              sampleText={sampleText}
              status={status}
              onCreate={createLocalization}
              onSampleTextChange={setSampleText}
            />
            <VoiceSummaryControl
              artifacts={voice}
              language={preference.preferred_language}
              readAloudReports={preference.read_aloud_reports}
              status={status}
              voiceText={voiceText}
              voiceType={voiceType}
              voiceSummaries={preference.voice_summaries}
              onCreate={createVoiceSummary}
              onPreferenceChange={savePatch}
              onVoiceTextChange={setVoiceText}
              onVoiceTypeChange={setVoiceType}
            />
          </section>

          <SeniorModeBehaviorPanel preference={preference} />
          <AccessibilityTestingChecklist />
        </section>
      </div>
    </main>
  );
}

function LanguageSelector({
  fallbackLanguage,
  languages,
  preferredLanguage,
  onChange
}: {
  fallbackLanguage: string;
  languages: Array<{ code: string; name: string; status: string }>;
  preferredLanguage: string;
  onChange: (patch: Pick<AccessibilityPreference, "preferred_language" | "fallback_language">) => void;
}) {
  const safeLanguages = languages.length ? languages : [{ code: "en", name: "English", status: "default" }];
  return (
    <div className="grid gap-4">
      <FormField label="Preferred language" hint="Static UI and generated artifacts can evolve separately while preserving medical terms.">
        <select className={inputClass} value={preferredLanguage} onChange={(event) => onChange({ preferred_language: event.target.value, fallback_language: fallbackLanguage })}>
          {safeLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Fallback language" hint="English fallback stays available when confidence is low.">
        <select className={inputClass} value={fallbackLanguage} onChange={(event) => onChange({ preferred_language: preferredLanguage, fallback_language: event.target.value })}>
          {safeLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

function TextSizeSelector({ onChange, value }: { value: string; onChange: (value: string) => void }) {
  return (
    <FormField label="Text size">
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="standard">Standard</option>
        <option value="large">Large</option>
        <option value="extra_large">Extra large</option>
      </select>
    </FormField>
  );
}

function SeniorModeToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <PreferenceToggle icon={Gauge} label="Senior Mode" checked={checked} onChange={onChange} description="Larger controls, reduced navigation, simpler Hub cards, and one-click primary actions." />;
}

function HighContrastToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <PreferenceToggle icon={Eye} label="High contrast" checked={checked} onChange={onChange} description="Raises border and primary contrast through global theme variables." />;
}

function ReduceMotionToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <PreferenceToggle icon={Zap} label="Reduce motion" checked={checked} onChange={onChange} description="Disables nonessential animation and smooth scrolling." />;
}

function PreferenceToggle({
  checked,
  description,
  icon: Icon,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  icon: LucideIcon;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-4 rounded-md border border-claro-border bg-white px-3 py-3">
      <span className="flex gap-3">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-claro-blue" aria-hidden />
        <span>
          <span className="block text-sm font-semibold text-claro-ink">{label}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
        </span>
      </span>
      <input className="h-5 w-5 shrink-0" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function OneClickActionEditor({
  actions,
  onChange
}: {
  actions: string[];
  onChange: (actions: string[]) => void;
}) {
  function toggleAction(value: string) {
    const nextActions = actions.includes(value)
      ? actions.filter((action) => action !== value)
      : [...actions, value];
    onChange(nextActions);
  }

  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={MousePointer2} title="One-Click Actions" description="Senior Mode prioritizes these shortcuts across simplified surfaces." />
      <div className="mt-4 grid gap-2">
        {oneClickOptions.map((option) => (
          <button
            className={cn(
              "flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm font-semibold",
              actions.includes(option.value) ? "border-claro-blue bg-blue-50 text-claro-blue" : "border-slate-300 text-slate-700"
            )}
            key={option.value}
            type="button"
            onClick={() => toggleAction(option.value)}
          >
            {option.label}
            {actions.includes(option.value) ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function SimplifiedDashboardPreview({
  dashboard,
  preference
}: {
  dashboard: SimplifiedDashboard | null;
  preference: AccessibilityPreference;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Gauge} title="Simplified Dashboard Preview" description="Shows how Senior Mode changes the Health Hub priority order." />
      {dashboard ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {dashboard.primary_cards.map((card) => (
              <article className="rounded-md border border-claro-border p-4" key={card.title}>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-2 text-2xl font-semibold text-claro-ink">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge tone={preference.senior_mode ? "success" : "neutral"}>{dashboard.mode}</StatusBadge>
            <StatusBadge tone={preference.high_contrast ? "success" : "neutral"}>{preference.high_contrast ? "high contrast" : "standard contrast"}</StatusBadge>
            <StatusBadge tone="info">{dashboard.text_size.replaceAll("_", " ")}</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.important_actions.map((action) => (
              <div className="rounded-md bg-claro-muted p-3 text-sm font-semibold text-claro-ink" key={action.href}>
                {action.label}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No simplified preview loaded" message="Refresh settings to see simplified Health Hub cards and primary actions." />
      )}
    </section>
  );
}

function MultilingualPanel({
  localized,
  onCreate,
  onSampleTextChange,
  plan,
  sampleText,
  status
}: {
  localized: LocalizedArtifact[];
  onCreate: () => void;
  onSampleTextChange: (value: string) => void;
  plan: AccessibilityPlan | null;
  sampleText: string;
  status: string;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Languages} title="Multilingual Strategy" description="Preserve clinical meaning while allowing static UI and generated artifacts to evolve separately." />
      <div className="mt-4 grid gap-2">
        {(plan?.translation_workflow.quality_checks ?? []).map((check) => (
          <div className="rounded-md bg-claro-muted p-3 text-sm leading-6 text-slate-700" key={check}>
            {check}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <FormField label="Translation draft sample">
          <textarea className={inputClass} rows={4} value={sampleText} onChange={(event) => onSampleTextChange(event.target.value)} />
        </FormField>
        <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="button" onClick={onCreate} disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Create translation draft
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {localized.length ? (
          localized.slice(0, 3).map((item) => (
            <article className="rounded-md border border-claro-border p-3" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="info">{item.language}</StatusBadge>
                <p className="font-semibold text-claro-ink">{item.source_type.replaceAll("_", " ")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.localized_text}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.model_name} - {item.prompt_version}</p>
            </article>
          ))
        ) : (
          <EmptyState title="No translation drafts" message="Create a draft to verify language, fallback, and quality checks." />
        )}
      </div>
    </section>
  );
}

function VoiceSummaryControl({
  artifacts,
  language,
  onCreate,
  onPreferenceChange,
  onVoiceTextChange,
  onVoiceTypeChange,
  readAloudReports,
  status,
  voiceSummaries,
  voiceText,
  voiceType
}: {
  artifacts: VoiceArtifact[];
  language: string;
  onCreate: () => void;
  onPreferenceChange: (patch: Partial<AccessibilityPreference>, successMessage?: string) => void;
  onVoiceTextChange: (value: string) => void;
  onVoiceTypeChange: (value: string) => void;
  readAloudReports: boolean;
  status: string;
  voiceSummaries: boolean;
  voiceText: string;
  voiceType: string;
}) {
  const latest = artifacts[0] ?? null;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1.0");

  function togglePlayback() {
    setPlaying((current) => !current);
  }

  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Volume2} title="Voice And Read-Aloud" description="Plan read-aloud scripts with controls for play, pause, replay, speed, language, and transcript." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ReadAloudButton enabled={readAloudReports} onChange={(checked) => onPreferenceChange({ read_aloud_reports: checked, voice_summaries: checked || voiceSummaries }, "Read-aloud preference saved.")} />
        <PreferenceToggle icon={Mic} label="Voice summaries" checked={voiceSummaries} onChange={(checked) => onPreferenceChange({ voice_summaries: checked }, "Voice summary preference saved.")} description="Prepare scripts for reports, assistant responses, doctor summaries, and emergency profile." />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField label="Voice target">
          <select className={inputClass} value={voiceType} onChange={(event) => onVoiceTypeChange(event.target.value)}>
            <option value="report_read_aloud">Report read aloud</option>
            <option value="assistant_response">Assistant response</option>
            <option value="doctor_summary">Doctor summary</option>
            <option value="emergency_profile">Emergency profile</option>
          </select>
        </FormField>
        <FormField label="Language">
          <input className={inputClass} value={language} readOnly />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Transcript">
          <textarea className={inputClass} rows={4} value={voiceText} onChange={(event) => onVoiceTextChange(event.target.value)} />
        </FormField>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="button" onClick={onCreate} disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          Plan voice
        </button>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={togglePlayback}>
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {playing ? "Pause" : "Play"}
        </button>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={() => setPlaying(false)}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Replay
        </button>
        <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700" value={speed} onChange={(event) => setSpeed(event.target.value)} aria-label="Voice speed">
          <option value="0.8">0.8x</option>
          <option value="1.0">1.0x</option>
          <option value="1.2">1.2x</option>
        </select>
      </div>
      {latest ? (
        <article className="mt-5 rounded-md border border-claro-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="attention">{latest.provider_status}</StatusBadge>
            <p className="font-semibold text-claro-ink">{latest.voice_type.replaceAll("_", " ")}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{latest.script_text}</p>
        </article>
      ) : null}
    </section>
  );
}

function ReadAloudButton({ enabled, onChange }: { enabled: boolean; onChange: (checked: boolean) => void }) {
  return <PreferenceToggle icon={Volume2} label="Read-aloud reports" checked={enabled} onChange={onChange} description="Show read-aloud controls on report summaries and explanations." />;
}

function SeniorModeBehaviorPanel({ preference }: { preference: AccessibilityPreference }) {
  const behaviors = [
    "Increase text and control targets",
    "Reduce navigation to frequent care actions",
    "Simplify Health Hub cards and labels",
    "Prioritize emergency profile, latest summary, medicines, reminders, and family contact",
    "Keep assistant prompts short and voice-friendly"
  ];
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={ShieldCheck} title="Senior Mode Behavior" description="These rules describe how the preference affects modules across MedClaro." />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {behaviors.map((behavior) => (
          <div className="flex gap-3 rounded-md bg-claro-muted p-3 text-sm leading-6 text-slate-700" key={behavior}>
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-claro-mint" aria-hidden />
            {behavior}
          </div>
        ))}
      </div>
      {preference.senior_mode ? (
        <SafetyNotice title="Senior Mode active">
          Navigation choices are reduced and simplified dashboard behavior is enabled.
        </SafetyNotice>
      ) : null}
    </section>
  );
}

function AccessibilityTestingChecklist() {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={CheckCircle2} title="Accessibility Testing" description="Required checks before release for keyboard, screen reader, contrast, motion, zoom, touch, and charts." />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {testingChecks.map((check) => (
          <div className="rounded-md border border-claro-border p-3 text-sm font-semibold text-claro-ink" key={check}>
            {check}
          </div>
        ))}
      </div>
    </section>
  );
}
