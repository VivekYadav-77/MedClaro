"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  Baby,
  BookOpen,
  CalendarClock,
  HeartPulse,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Watch
} from "lucide-react";
import { apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";

type RoadmapItem = {
  module_key: string;
  priority: string;
  status: string;
  user_value: string;
  dependencies: string[];
  profile_connections: string[];
  timeline_event_types: string[];
};

type Strategy = {
  roadmap: RoadmapItem[];
  data_extension_strategy: {
    principle: string;
    vault_anchor: string[];
  };
  health_education_strategy: {
    content_types: string[];
    review_policy: string;
    personalization: string;
  };
  advanced_ai_safety: {
    model: string;
    prompt_version: string;
    rules: string[];
  };
};

type VaccinationRecord = {
  id: number;
  vaccine_name: string;
  next_due_on: string | null;
  reminder_rules: string[];
};

type WomensHealthRecord = {
  id: number;
  record_type: string;
  record_date: string;
  doctor_discussion_points: string[];
};

type ChildProfile = {
  id: number;
  child_name: string;
  date_of_birth: string;
  measurements: Array<{ id: number; measured_on: string; height_cm: string; weight_kg: string }>;
};

type InsurancePolicy = {
  id: number;
  provider_name: string;
  policy_number: string;
  coverage_type: string;
};

type SecondOpinion = {
  id: number;
  concern: string;
  status: string;
  questions_to_ask: string[];
  safety_language: string[];
};

type EducationItem = {
  id: number;
  title: string;
  content_type: string;
  audience: string;
  summary: string;
};

type WearableStrategy = {
  supported_metrics: string[];
  consent_scopes: string[];
  timeline_policy: string;
  assistant_policy: string;
};

type Boundary = {
  id: number;
  partner_type: string;
  inbound_data: string[];
  outbound_data: string[];
  permission_boundary: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function FutureModulesPage() {
  const { token } = useSession();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [womensHealth, setWomensHealth] = useState<WomensHealthRecord[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([]);
  const [secondOpinions, setSecondOpinions] = useState<SecondOpinion[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [wearables, setWearables] = useState<WearableStrategy | null>(null);
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    return apiJson<T>(path, {
      method: options.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined,
      token,
      body: typeof options.body === "string" ? JSON.parse(options.body) : undefined
    });
  }

  async function loadAll() {
    setStatus("loading");
    try {
      const [
        strategyData,
        vaccinationData,
        womensHealthData,
        childrenData,
        insuranceData,
        secondOpinionData,
        educationData,
        wearableData,
        boundaryData
      ] = await Promise.all([
        apiFetch<Strategy>("/future-modules/strategy/"),
        apiFetch<VaccinationRecord[]>("/future-modules/vaccinations/"),
        apiFetch<WomensHealthRecord[]>("/future-modules/womens-health/"),
        apiFetch<ChildProfile[]>("/future-modules/children/"),
        apiFetch<InsurancePolicy[]>("/future-modules/insurance/"),
        apiFetch<SecondOpinion[]>("/future-modules/second-opinions/"),
        apiFetch<EducationItem[]>("/future-modules/education-library/"),
        apiFetch<WearableStrategy>("/future-modules/wearables/strategy/"),
        apiFetch<Boundary[]>("/future-modules/integration-boundaries/")
      ]);
      setStrategy(strategyData);
      setVaccinations(vaccinationData);
      setWomensHealth(womensHealthData);
      setChildren(childrenData);
      setInsurance(insuranceData);
      setSecondOpinions(secondOpinionData);
      setEducation(educationData);
      setWearables(wearableData);
      setBoundaries(boundaryData);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function createVaccination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<VaccinationRecord>("/future-modules/vaccinations/", {
        method: "POST",
        body: JSON.stringify({
          vaccine_name: "Influenza",
          dose_label: "Annual",
          next_due_on: "2026-08-01",
          provider: "Family clinic"
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createWomensHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<WomensHealthRecord>("/future-modules/womens-health/", {
        method: "POST",
        body: JSON.stringify({
          record_type: "iron",
          record_date: "2026-07-12",
          symptoms: ["fatigue"],
          metrics: { ferritin: "to discuss" },
          notes: "Planning record for iron and calcium tracking."
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<ChildProfile>("/future-modules/children/", {
        method: "POST",
        body: JSON.stringify({
          child_name: "Sample child",
          date_of_birth: "2021-05-10",
          sex: "not specified",
          pediatrician: "Pediatric clinic"
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createInsurance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<InsurancePolicy>("/future-modules/insurance/", {
        method: "POST",
        body: JSON.stringify({
          provider_name: "Sample Health Cover",
          policy_number: "POL-2026-001",
          coverage_type: "Family floater",
          emergency_claim_phone: "+91-00000-00000",
          document_ids: []
        })
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createSecondOpinion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<SecondOpinion>("/future-modules/second-opinions/", {
        method: "POST",
        body: JSON.stringify({
          concern: "I want to prepare discussion points before asking another doctor to review my reports."
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
          <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
            Future Ecosystem
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
            Modules, Integrations, And Safety Expansion
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Plan the next layer of MedClaro around the Personal Health Profile,
            Medical Vault, Health Timeline, permissions, and AI safety rules.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">Ecosystem data</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Internal roadmap records load through the shared MedClaro session.
            </p>
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
              Load Ecosystem
            </button>
            {status === "error" ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check your session and backend availability.
              </p>
            ) : null}
          </section>

          <ActionPanel
            icon={Syringe}
            title="Vaccination"
            text="Create a tracker record with reminder planning."
            onSubmit={createVaccination}
          />
          <ActionPanel
            icon={HeartPulse}
            title="Women's Health"
            text="Add an iron, calcium, PCOS, pregnancy, period, or menopause planning entry."
            onSubmit={createWomensHealth}
          />
          <ActionPanel
            icon={Baby}
            title="Child Growth"
            text="Create a child profile for future growth measurements."
            onSubmit={createChild}
          />
          <ActionPanel
            icon={ShieldCheck}
            title="Insurance"
            text="Add policy metadata linked to future vault documents."
            onSubmit={createInsurance}
          />
          <ActionPanel
            icon={Stethoscope}
            title="Second Opinion"
            text="Generate doctor discussion points and safety language."
            onSubmit={createSecondOpinion}
          />
        </aside>

        <section className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Module Priority
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {strategy?.roadmap.map((item) => (
                <article className="rounded-md border border-slate-200 p-4" key={item.module_key}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold capitalize text-claro-ink">
                      {item.module_key.replaceAll("_", " ")}
                    </p>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                      {item.priority}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-claro-blue">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.user_value}</p>
                  <p className="mt-3 text-xs font-semibold uppercase text-slate-500">
                    Timeline: {item.timeline_event_types.join(", ")}
                  </p>
                </article>
              )) ?? <Empty text="Load ecosystem strategy to view roadmap priorities." />}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <SummaryCard
              icon={Syringe}
              title="Vaccination Records"
              items={vaccinations.map((item) => ({
                title: item.vaccine_name,
                detail: item.reminder_rules[0] ?? "Reminder planning pending"
              }))}
              empty="No vaccination records yet."
            />
            <SummaryCard
              icon={HeartPulse}
              title="Women's Health"
              items={womensHealth.map((item) => ({
                title: item.record_type.replaceAll("_", " "),
                detail: item.doctor_discussion_points[0] ?? item.record_date
              }))}
              empty="No women's health records yet."
            />
            <SummaryCard
              icon={Baby}
              title="Child Growth"
              items={children.map((item) => ({
                title: item.child_name,
                detail: `Born ${item.date_of_birth}; ${item.measurements.length} measurement(s)`
              }))}
              empty="No child profiles yet."
            />
            <SummaryCard
              icon={ShieldCheck}
              title="Insurance Folder"
              items={insurance.map((item) => ({
                title: item.provider_name,
                detail: `${item.coverage_type || "Coverage"} - ${item.policy_number}`
              }))}
              empty="No insurance policies yet."
            />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Second Opinion AI Guardrails
              </h2>
            </div>
            {strategy ? (
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  {strategy.advanced_ai_safety.model} - {strategy.advanced_ai_safety.prompt_version}
                </p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  {strategy.advanced_ai_safety.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {secondOpinions.map((item) => (
                <article className="rounded-md border border-slate-200 p-4" key={item.id}>
                  <p className="text-sm font-semibold text-claro-ink">{item.status}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.questions_to_ask[0]}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Health Education Library
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {education.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <p className="text-sm font-semibold text-claro-ink">{item.title}</p>
                    <p className="mt-1 text-xs uppercase text-slate-500">
                      {item.content_type} - {item.audience}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </article>
                ))}
                {!education.length ? <Empty text="Load ecosystem strategy to view education items." /> : null}
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Watch className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Wearables And Partners
                </h2>
              </div>
              {wearables ? (
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Metrics: {wearables.supported_metrics.join(", ")}</p>
                  <p>{wearables.timeline_policy}</p>
                  <p>{wearables.assistant_policy}</p>
                </div>
              ) : (
                <Empty text="Load wearable strategy to view metrics and consent scopes." />
              )}
              <div className="mt-4 space-y-3">
                {boundaries.map((item) => (
                  <article className="rounded-md border border-slate-200 p-3" key={item.id}>
                    <p className="text-sm font-semibold capitalize text-claro-ink">
                      {item.partner_type}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.permission_boundary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </section>

          {strategy ? (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-claro-ink">
                Data Extension Strategy
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {strategy.data_extension_strategy.principle}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {strategy.data_extension_strategy.vault_anchor.map((item) => (
                  <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" key={item}>
                    {item.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ActionPanel({
  icon: Icon,
  title,
  text,
  onSubmit
}: {
  icon: typeof Syringe;
  title: string;
  text: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-md border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-claro-blue" />
        <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <button
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        type="submit"
      >
        Add Sample
      </button>
    </form>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  items,
  empty
}: {
  icon: typeof Syringe;
  title: string;
  items: Array<{ title: string; detail: string }>;
  empty: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-claro-blue" />
        <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article className="rounded-md border border-slate-200 p-3" key={`${title}-${item.title}`}>
            <p className="text-sm font-semibold text-claro-ink">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </article>
        ))}
        {!items.length ? <Empty text={empty} /> : null}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
      {text}
    </p>
  );
}
