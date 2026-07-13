"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Apple,
  BookOpen,
  BrainCircuit,
  Dumbbell,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Smile,
  Thermometer,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  FormField,
  InlineValidation,
  PageHeader,
  SafetyNotice,
  SectionHeader,
  SegmentedControl,
  StatusBadge,
  SuccessLine
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type SymptomLog = {
  id: number;
  symptom: string;
  severity: string;
  pain_level: number | null;
  started_at: string;
  ended_at: string | null;
  triggers: string[];
  notes: string;
  doctor_consultation_recommended: boolean;
  safety_notes: string[];
};

type JournalEntry = {
  id: number;
  entry_date: string;
  title: string;
  notes: string;
  mood: number | null;
  stress: number | null;
  sleep_hours: string | null;
  energy: number | null;
  pain: number | null;
  water_ml: number | null;
  tags: string[];
};

type LifestylePlan = {
  id: number;
  plan_type: string;
  title: string;
  summary: string;
  recommendations: string[];
  restrictions: string[];
  doctor_consultation_prompts: string[];
  safety_notes: string[];
  model_name: string;
  prompt_version: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

const symptomChips = ["Headache", "Fever", "Fatigue", "Cough", "Nausea", "Body pain"];
const tagChips = ["work", "medicine", "food", "sleep", "stress", "exercise"];

export default function DailyHealthPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [painLevel, setPainLevel] = useState(0);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalNotes, setJournalNotes] = useState("");
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState("");
  const [energy, setEnergy] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [planTab, setPlanTab] = useState("diet");
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [plans, setPlans] = useState<LifestylePlan[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "planning" | "loaded" | "error">("loading");
  const [message, setMessage] = useState("");

  const severeSymptom = severity === "severe" || severity === "critical" || painLevel >= 8;
  const filteredPlans = useMemo(() => plans.filter((plan) => plan.plan_type === planTab), [planTab, plans]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function loadHistory() {
    setStatus("loading");
    setMessage("");
    try {
      const query = search ? `?q=${encodeURIComponent(search)}` : "";
      const [symptomData, journalData, planData] = await Promise.all([
        apiGet<SymptomLog[]>("/daily-health/symptoms/", token),
        apiGet<JournalEntry[]>(`/daily-health/journal/${query}`, token),
        apiGet<LifestylePlan[]>("/daily-health/plans/", token)
      ]);
      setSymptoms(symptomData);
      setJournal(journalData);
      setPlans(planData);
      setStatus("loaded");
    } catch {
      setStatus("error");
      setMessage("Could not load daily health history. Check your session and try again.");
    }
  }

  async function submitSymptom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!symptom.trim()) {
      setStatus("error");
      setMessage("Add a symptom before logging your check-in.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<SymptomLog>("/daily-health/symptoms/", {
        method: "POST",
        token,
        body: {
          symptom: symptom.trim(),
          severity,
          pain_level: painLevel,
          started_at: new Date().toISOString(),
          triggers: tags,
          notes: symptomNotes
        }
      });
      setSymptom("");
      setPainLevel(0);
      setSymptomNotes("");
      await loadHistory();
      setMessage(severeSymptom ? "Symptom logged. Care guidance is visible because this may need medical attention." : "Symptom logged.");
    } catch {
      setStatus("error");
      setMessage("Could not save symptom. Check required fields and try again.");
    }
  }

  async function submitJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<JournalEntry>("/daily-health/journal/", {
        method: "POST",
        token,
        body: {
          entry_date: new Date().toISOString().slice(0, 10),
          title: journalTitle,
          notes: journalNotes,
          mood,
          stress,
          sleep_hours: sleepHours || null,
          energy,
          pain: painLevel,
          tags
        }
      });
      setJournalTitle("");
      setJournalNotes("");
      setSleepHours("");
      await loadHistory();
      setMessage("Daily journal entry saved.");
    } catch {
      setStatus("error");
      setMessage("Could not save journal entry. Check values and try again.");
    }
  }

  async function generatePlan(planType: "diet" | "exercise") {
    setStatus("planning");
    setMessage("");
    setPlanTab(planType);
    try {
      await apiJson<LifestylePlan>("/daily-health/plans/", {
        method: "POST",
        token,
        body: { plan_type: planType }
      });
      await loadHistory();
      setMessage(`${planType === "diet" ? "Diet" : "Exercise"} plan generated with restrictions and doctor prompts.`);
    } catch {
      setStatus("error");
      setMessage("Could not generate lifestyle plan. Complete profile context and try again.");
    }
  }

  function toggleTag(tag: string) {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading daily health" />
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
        eyebrow="Daily Health"
        title="Quick Check-In, Journal, And Lifestyle Plans"
        description="Capture symptoms and daily signals quickly, then turn profile/report context into conservative diet and exercise plans."
        actions={
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="button" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          severeSymptom ? (
            <SafetyNotice title="Consider urgent care guidance" tone="risk">
              Severe symptoms, critical symptoms, breathing trouble, chest pain, fainting, or pain near 8-10 should be discussed with urgent care or a qualified clinician.
            </SafetyNotice>
          ) : (
            <SafetyNotice title="Gentle daily tracking">
              Daily Health helps build context for your timeline and assistant. It does not diagnose symptoms.
            </SafetyNotice>
          )
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <DailyCheckInForm
            painLevel={painLevel}
            severity={severity}
            symptom={symptom}
            symptomNotes={symptomNotes}
            tags={tags}
            status={status}
            onPainChange={setPainLevel}
            onSeverityChange={setSeverity}
            onSubmit={submitSymptom}
            onSymptomChange={setSymptom}
            onSymptomNotesChange={setSymptomNotes}
            onTagToggle={toggleTag}
          />
          {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}
          {message && status === "loaded" ? <SuccessLine>{message}</SuccessLine> : null}
        </aside>

        <section className="space-y-6">
          <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={submitJournal}>
            <SectionHeader icon={BookOpen} title="Journal Entry" description="A short note and a few sliders are enough for useful context." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField label="Title">
                <input className={inputClass} value={journalTitle} onChange={(event) => setJournalTitle(event.target.value)} />
              </FormField>
              <FormField label="Sleep hours">
                <input className={inputClass} inputMode="decimal" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} />
              </FormField>
              <SliderField icon={Smile} label="Mood" value={mood} onChange={setMood} />
              <SliderField icon={AlertCircle} label="Stress" value={stress} onChange={setStress} />
              <SliderField icon={Zap} label="Energy" value={energy} onChange={setEnergy} />
              <div className="md:col-span-2">
                <FormField label="Notes">
                  <textarea className={inputClass} rows={3} value={journalNotes} onChange={(event) => setJournalNotes(event.target.value)} />
                </FormField>
              </div>
            </div>
            <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={status === "saving"}>
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Save entry
            </button>
          </form>

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <SectionHeader icon={Search} title="History" description="Search journal entries and scan recent symptom safety notes." />
              <div className="flex gap-2">
                <input className={`${inputClass} md:w-64`} placeholder="Search journal" value={search} onChange={(event) => setSearch(event.target.value)} />
                <button className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700" type="button" onClick={loadHistory}>
                  Search
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <HistoryPanel
                title="Symptoms"
                items={symptoms.map((item) => ({
                  key: item.id,
                  title: `${item.symptom} · ${item.severity}`,
                  body: item.notes || item.safety_notes.join(" ") || "No notes added.",
                  meta: new Date(item.started_at).toLocaleString(),
                  flagged: item.doctor_consultation_recommended
                }))}
              />
              <HistoryPanel
                title="Journal"
                items={journal.map((item) => ({
                  key: item.id,
                  title: item.title || item.entry_date,
                  body: item.notes || "No notes added.",
                  meta: `Mood ${item.mood ?? "n/a"} · Stress ${item.stress ?? "n/a"} · Sleep ${item.sleep_hours ?? "n/a"}`,
                  flagged: false
                }))}
              />
            </div>
          </section>

          <LifestylePlanPanel
            activeTab={planTab}
            plans={filteredPlans}
            status={status}
            onGenerate={generatePlan}
            onTabChange={setPlanTab}
          />
        </section>
      </div>
    </main>
  );
}

function DailyCheckInForm({
  painLevel,
  severity,
  symptom,
  symptomNotes,
  tags,
  status,
  onPainChange,
  onSeverityChange,
  onSubmit,
  onSymptomChange,
  onSymptomNotesChange,
  onTagToggle
}: {
  painLevel: number;
  severity: string;
  symptom: string;
  symptomNotes: string;
  tags: string[];
  status: string;
  onPainChange: (value: number) => void;
  onSeverityChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSymptomChange: (value: string) => void;
  onSymptomNotesChange: (value: string) => void;
  onTagToggle: (value: string) => void;
}) {
  return (
    <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={onSubmit}>
      <SectionHeader icon={Thermometer} title="Quick Check-In" description="Log a symptom in under a minute." />
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {symptomChips.map((chip) => (
            <button className={cn("min-h-10 rounded-md border px-3 text-sm font-semibold", symptom === chip ? "border-claro-blue bg-blue-50 text-claro-blue" : "border-slate-300 text-slate-700")} key={chip} type="button" onClick={() => onSymptomChange(chip)}>
              {chip}
            </button>
          ))}
        </div>
        <FormField label="Symptom">
          <input className={inputClass} value={symptom} onChange={(event) => onSymptomChange(event.target.value)} />
        </FormField>
        <FormField label="Severity">
          <select className={inputClass} value={severity} onChange={(event) => onSeverityChange(event.target.value)}>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
        <SliderField icon={Thermometer} label="Pain level" min={0} value={painLevel} onChange={onPainChange} />
        <FormField label="Notes">
          <textarea className={inputClass} rows={3} value={symptomNotes} onChange={(event) => onSymptomNotesChange(event.target.value)} />
        </FormField>
        <div>
          <p className="text-sm font-medium text-slate-700">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tagChips.map((tag) => (
              <button className={cn("min-h-10 rounded-md border px-3 text-sm font-semibold", tags.includes(tag) ? "border-claro-mint bg-emerald-50 text-claro-mint" : "border-slate-300 text-slate-700")} key={tag} type="button" onClick={() => onTagToggle(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          Log symptom
        </button>
      </div>
    </form>
  );
}

function SliderField({
  icon: Icon,
  label,
  max = 10,
  min = 1,
  onChange,
  value
}: {
  icon: LucideIcon;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-claro-blue" aria-hidden />
        {label}: {value}
      </span>
      <input className="mt-3 w-full accent-claro-blue" max={max} min={min} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function HistoryPanel({
  items,
  title
}: {
  title: string;
  items: Array<{ key: number; title: string; body: string; meta: string; flagged: boolean }>;
}) {
  return (
    <section>
      <h3 className="font-semibold text-claro-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-md border border-claro-border p-3" key={item.key}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-claro-ink">{item.title}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{item.meta}</p>
                </div>
                {item.flagged ? <StatusBadge tone="attention">care guidance</StatusBadge> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))
        ) : (
          <EmptyState title={`No ${title.toLowerCase()} loaded`} message="Refresh or add a new entry to populate this history." />
        )}
      </div>
    </section>
  );
}

function LifestylePlanPanel({
  activeTab,
  onGenerate,
  onTabChange,
  plans,
  status
}: {
  activeTab: string;
  onGenerate: (type: "diet" | "exercise") => void;
  onTabChange: (value: string) => void;
  plans: LifestylePlan[];
  status: string;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <SectionHeader icon={BrainCircuit} title="Lifestyle Planning" description="Plans must show recommendations, restrictions, safety notes, and doctor prompts." />
        <SegmentedControl
          label="Plan type"
          options={[
            { value: "diet", label: "Diet" },
            { value: "exercise", label: "Exercise" }
          ]}
          value={activeTab}
          onChange={onTabChange}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-70" type="button" onClick={() => onGenerate("diet")} disabled={status === "planning"}>
          <Apple className="h-4 w-4" aria-hidden />
          Generate diet
        </button>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-70" type="button" onClick={() => onGenerate("exercise")} disabled={status === "planning"}>
          <Dumbbell className="h-4 w-4" aria-hidden />
          Generate exercise
        </button>
      </div>
      <div className="mt-5 space-y-4">
        {plans.length ? (
          plans.map((plan) => <LifestylePlanCard key={plan.id} plan={plan} />)
        ) : (
          <EmptyState title="No plans in this tab" message="Generate a conservative lifestyle plan from your profile, reports, medicines, and daily context." />
        )}
      </div>
    </section>
  );
}

function LifestylePlanCard({ plan }: { plan: LifestylePlan }) {
  return (
    <article className="rounded-md border border-claro-border p-4">
      <div className="flex items-center gap-2">
        {plan.plan_type === "diet" ? <Apple className="h-4 w-4 text-claro-mint" aria-hidden /> : <Dumbbell className="h-4 w-4 text-claro-blue" aria-hidden />}
        <h3 className="font-semibold text-claro-ink">{plan.title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{plan.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ListBlock title="Recommendations" items={plan.recommendations} />
        <ListBlock title="Restrictions" items={plan.restrictions} tone="attention" />
        <ListBlock title="Doctor prompts" items={plan.doctor_consultation_prompts} />
        <ListBlock title="Safety notes" items={plan.safety_notes} tone="risk" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{plan.model_name} · {plan.prompt_version}</p>
    </article>
  );
}

function ListBlock({ items, title, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "attention" | "risk" }) {
  const Icon = tone === "risk" ? ShieldAlert : tone === "attention" ? AlertCircle : Activity;
  return (
    <section className="rounded-md bg-claro-muted p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-claro-blue" aria-hidden />
        <h4 className="text-sm font-semibold text-claro-ink">{title}</h4>
      </div>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No items generated.</p>
      )}
    </section>
  );
}
