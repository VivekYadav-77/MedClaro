"use client";

import { FormEvent, useState } from "react";
import {
  Activity,
  AlertCircle,
  Apple,
  BookOpen,
  Dumbbell,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Thermometer
} from "lucide-react";

type SymptomLog = {
  id: number;
  symptom: string;
  severity: string;
  pain_level: number | null;
  started_at: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function DailyHealthPage() {
  const [token, setToken] = useState("");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [painLevel, setPainLevel] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalNotes, setJournalNotes] = useState("");
  const [mood, setMood] = useState("");
  const [stress, setStress] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [energy, setEnergy] = useState("");
  const [search, setSearch] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [plans, setPlans] = useState<LifestylePlan[]>([]);
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

  async function loadHistory() {
    setStatus("loading");
    try {
      const query = search ? `?q=${encodeURIComponent(search)}` : "";
      const [symptomData, journalData, planData] = await Promise.all([
        apiFetch<SymptomLog[]>("/daily-health/symptoms/"),
        apiFetch<JournalEntry[]>(`/daily-health/journal/${query}`),
        apiFetch<LifestylePlan[]>("/daily-health/plans/")
      ]);
      setSymptoms(symptomData);
      setJournal(journalData);
      setPlans(planData);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function submitSymptom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<SymptomLog>("/daily-health/symptoms/", {
        method: "POST",
        body: JSON.stringify({
          symptom,
          severity,
          pain_level: painLevel ? Number(painLevel) : null,
          started_at: new Date().toISOString(),
          triggers: [],
          notes: journalNotes
        })
      });
      setSymptom("");
      setPainLevel("");
      await loadHistory();
    } catch {
      setStatus("error");
    }
  }

  async function submitJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<JournalEntry>("/daily-health/journal/", {
        method: "POST",
        body: JSON.stringify({
          entry_date: new Date().toISOString().slice(0, 10),
          title: journalTitle,
          notes: journalNotes,
          mood: mood ? Number(mood) : null,
          stress: stress ? Number(stress) : null,
          sleep_hours: sleepHours || null,
          energy: energy ? Number(energy) : null,
          tags: []
        })
      });
      setJournalTitle("");
      setJournalNotes("");
      setMood("");
      setStress("");
      setSleepHours("");
      setEnergy("");
      await loadHistory();
    } catch {
      setStatus("error");
    }
  }

  async function generatePlan(planType: "diet" | "exercise") {
    setStatus("loading");
    try {
      await apiFetch<LifestylePlan>("/daily-health/plans/", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType })
      });
      await loadHistory();
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
                Daily Health
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Track Symptoms, Journal Signals, And Lifestyle Plans
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Capture daily health context for the timeline, assistant memory,
                and conservative diet and exercise planning.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                Lifestyle safety rules
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Severe symptoms and major lifestyle changes should go through a clinician.
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
            <div className="mt-4 flex gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={loadHistory}
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Load
              </button>
            </div>
            {status === "error" ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check token and required fields.
              </p>
            ) : null}
          </section>

          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={submitSymptom}
          >
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-claro-rose" />
              <h2 className="text-lg font-semibold text-claro-ink">Symptom</h2>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Symptom
              <input
                className={inputClass}
                value={symptom}
                onChange={(event) => setSymptom(event.target.value)}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Severity
              <select
                className={inputClass}
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Pain level
              <input
                className={inputClass}
                inputMode="numeric"
                max="10"
                min="0"
                value={painLevel}
                onChange={(event) => setPainLevel(event.target.value)}
              />
            </label>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
            >
              <Plus className="h-4 w-4" />
              Log Symptom
            </button>
          </form>
        </aside>

        <section className="space-y-6">
          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={submitJournal}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Quick Daily Entry
              </h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  className={inputClass}
                  value={journalTitle}
                  onChange={(event) => setJournalTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Sleep hours
                <input
                  className={inputClass}
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mood
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Stress
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={stress}
                  onChange={(event) => setStress(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Energy
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={energy}
                  onChange={(event) => setEnergy(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Notes
                <textarea
                  className={inputClass}
                  rows={3}
                  value={journalNotes}
                  onChange={(event) => setJournalNotes(event.target.value)}
                />
              </label>
            </div>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
            >
              <Plus className="h-4 w-4" />
              Save Entry
            </button>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  History Search
                </h2>
              </div>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100 md:w-64"
                placeholder="Search journal"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <HistoryPanel title="Symptoms" items={symptoms.map((item) => ({
                key: item.id,
                title: `${item.symptom} - ${item.severity}`,
                body: item.notes || item.safety_notes.join(" "),
                meta: new Date(item.started_at).toLocaleString()
              }))} />
              <HistoryPanel title="Journal" items={journal.map((item) => ({
                key: item.id,
                title: item.title || item.entry_date,
                body: item.notes,
                meta: `Mood ${item.mood ?? "n/a"} - Stress ${item.stress ?? "n/a"}`
              }))} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-claro-ink">
                  Lifestyle Planning
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Generate conservative plans from profile, reports, trends, and medication context.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={() => generatePlan("diet")}
                >
                  <Apple className="h-4 w-4" />
                  Diet Plan
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={() => generatePlan("exercise")}
                >
                  <Dumbbell className="h-4 w-4" />
                  Exercise Plan
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {plans.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  No lifestyle plans generated yet.
                </p>
              ) : (
                plans.map((plan) => (
                  <article className="rounded-md border border-slate-200 p-4" key={plan.id}>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-claro-blue" />
                      <h3 className="font-semibold text-claro-ink">{plan.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {plan.summary}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <ListBlock title="Recommendations" items={plan.recommendations} />
                      <ListBlock title="Restrictions" items={plan.restrictions} />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase text-slate-500">
                      {plan.model_name} - {plan.prompt_version}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function HistoryPanel({
  title,
  items
}: {
  title: string;
  items: Array<{ key: number; title: string; body: string; meta: string }>;
}) {
  return (
    <section>
      <h3 className="font-semibold text-claro-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            No records loaded.
          </p>
        ) : (
          items.map((item) => (
            <article className="rounded-md border border-slate-200 p-3" key={item.key}>
              <p className="text-sm font-semibold text-claro-ink">{item.title}</p>
              <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                {item.meta}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-md bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
