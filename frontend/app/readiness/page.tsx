"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  DatabaseBackup,
  Eye,
  KeyRound,
  Loader2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Stethoscope,
  TestTube2
} from "lucide-react";

type ReadinessPlan = {
  testing_strategy: {
    backend: {
      command: string;
      coverage_targets: Array<{ area: string; coverage: string[]; status: string }>;
      permission_tests: string[];
    };
    frontend: {
      command: string;
      critical_flows: string[];
      recommended_tools: string[];
    };
    ai_mocks: {
      strategy: string;
      modules: string[];
      assertions: string[];
    };
  };
  security_hardening: {
    checklist: string[];
    headers_and_cookies: string[];
    data_access: string;
  };
  observability_plan: {
    events: string[];
    minimum_alerts: string[];
    logging_policy: string;
  };
  deployment_plan: {
    environments: string[];
    backend: string[];
    frontend: string[];
    secrets: string[];
  };
  backup_restore_plan: {
    postgresql: string[];
    media: string[];
  };
  disclaimers: {
    medical: string;
    privacy: string;
    urgent_care: string;
  };
  release_checklist: Array<{ item: string; owner: string; required: boolean }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function ReleaseReadinessPage() {
  const [token, setToken] = useState("");
  const [plan, setPlan] = useState<ReadinessPlan | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  async function loadPlan() {
    setStatus("loading");
    try {
      const response = await fetch(`${API_URL}/release-readiness/plan/`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      setPlan((await response.json()) as ReadinessPlan);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
            Release Readiness
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
            Testing, Security, Deployment, And Monitoring
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Validate critical workflows, permission boundaries, AI safety,
            production hardening, backups, and first-release gates.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
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
              onClick={loadPlan}
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Load Plan
            </button>
            {status === "error" ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check token and backend availability.
              </p>
            ) : null}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Release Gates
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {plan?.release_checklist.map((item) => (
                <div className="rounded-md border border-slate-200 p-3" key={item.item}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-claro-mint" />
                    <div>
                      <p className="text-sm font-semibold text-claro-ink">{item.item}</p>
                      <p className="mt-1 text-xs uppercase text-slate-500">{item.owner}</p>
                    </div>
                  </div>
                </div>
              )) ?? <Empty text="Load the readiness plan to view release gates." />}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel icon={TestTube2} title="Backend Test Strategy">
              <p className="text-sm font-semibold text-slate-700">
                {plan?.testing_strategy.backend.command ?? "Backend test command appears after loading."}
              </p>
              <div className="mt-4 space-y-3">
                {plan?.testing_strategy.backend.coverage_targets.map((target) => (
                  <article className="rounded-md border border-slate-200 p-3" key={target.area}>
                    <p className="text-sm font-semibold capitalize text-claro-ink">
                      {target.area.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs uppercase text-slate-500">{target.status}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {target.coverage.join(", ")}
                    </p>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel icon={ShieldCheck} title="Security Hardening">
              <p className="text-sm leading-6 text-slate-600">
                {plan?.security_hardening.data_access ?? "Owner-scoped access and explicit permission grants are validated here."}
              </p>
              <Checklist items={plan?.security_hardening.checklist ?? []} />
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel icon={Eye} title="Monitoring Plan">
              <p className="text-sm leading-6 text-slate-600">
                {plan?.observability_plan.logging_policy ?? "Load the plan to view logging policy."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan?.observability_plan.events.map((eventName) => (
                  <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" key={eventName}>
                    {eventName.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel icon={DatabaseBackup} title="Backup And Restore">
              <h3 className="text-sm font-semibold text-claro-ink">PostgreSQL</h3>
              <Checklist items={plan?.backup_restore_plan.postgresql ?? []} />
              <h3 className="mt-4 text-sm font-semibold text-claro-ink">Media</h3>
              <Checklist items={plan?.backup_restore_plan.media ?? []} />
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel icon={KeyRound} title="Deployment And Secrets">
              <div className="flex flex-wrap gap-2">
                {plan?.deployment_plan.environments.map((environment) => (
                  <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-claro-blue" key={environment}>
                    {environment}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-claro-ink">Secrets</h3>
              <Checklist items={plan?.deployment_plan.secrets ?? []} />
            </Panel>

            <Panel icon={Stethoscope} title="Medical And Privacy Disclaimers">
              {plan ? (
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>{plan.disclaimers.medical}</p>
                  <p>{plan.disclaimers.privacy}</p>
                  <p>{plan.disclaimers.urgent_care}</p>
                </div>
              ) : (
                <Empty text="Load the readiness plan to view final disclaimer language." />
              )}
            </Panel>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Frontend And AI Mock Plan
            </h2>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {plan?.testing_strategy.frontend.command ?? "Frontend build command appears after loading."}
                </p>
                <Checklist items={plan?.testing_strategy.frontend.critical_flows ?? []} />
              </div>
              <div>
                <p className="text-sm leading-6 text-slate-600">
                  {plan?.testing_strategy.ai_mocks.strategy ?? "Load the plan to view AI mock strategy."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan?.testing_strategy.ai_mocks.modules.map((moduleName) => (
                    <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" key={moduleName}>
                      {moduleName.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Panel({
  icon: Icon,
  title,
  children
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-claro-blue" />
        <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  if (!items.length) {
    return <Empty text="Load the readiness plan to view this checklist." />;
  }

  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-claro-mint" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
      {text}
    </p>
  );
}
