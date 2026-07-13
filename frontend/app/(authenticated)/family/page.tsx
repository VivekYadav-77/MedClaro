"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  FileHeart,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users
} from "lucide-react";
import { apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";

type Membership = {
  id: number;
  display_name: string;
  email: string;
  role: string;
  status: string;
  permission_grants: Array<{ id: number; permission: string; is_allowed: boolean }>;
};

type Circle = {
  id: number;
  name: string;
  description: string;
  memberships: Membership[];
};

type DoctorSummary = {
  id: number;
  title: string;
  summary_payload: Record<string, unknown>;
  questions_for_doctor: string[];
  model_name: string;
  prompt_version: string;
  generated_at: string;
};

type EmergencyShare = {
  id: number;
  label: string;
  token: string;
  qr_payload: Record<string, unknown>;
  profile_payload: Record<string, unknown>;
  is_active: boolean;
  is_expired: boolean;
  expires_at: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function FamilyPage() {
  const { token } = useSession();
  const [circleName, setCircleName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("caregiver");
  const [circles, setCircles] = useState<Circle[]>([]);
  const [summaries, setSummaries] = useState<DoctorSummary[]>([]);
  const [shares, setShares] = useState<EmergencyShare[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

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
      const [circleData, summaryData, shareData] = await Promise.all([
        apiFetch<Circle[]>("/family-care/circles/"),
        apiFetch<DoctorSummary[]>("/family-care/doctor-summaries/"),
        apiFetch<EmergencyShare[]>("/family-care/emergency-shares/")
      ]);
      setCircles(circleData);
      setSummaries(summaryData);
      setShares(shareData);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function createCircle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      await apiFetch<Circle>("/family-care/circles/", {
        method: "POST",
        body: JSON.stringify({
          name: circleName,
          description: "Trusted care circle"
        })
      });
      setCircleName("");
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const circle = circles[0];
    if (!circle) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await apiFetch(`/family-care/circles/${circle.id}/invite/`, {
        method: "POST",
        body: JSON.stringify({
          display_name: inviteName,
          email: inviteEmail,
          role: inviteRole
        })
      });
      setInviteName("");
      setInviteEmail("");
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function generateDoctorSummary() {
    setStatus("loading");
    try {
      await apiFetch<DoctorSummary>("/family-care/doctor-summaries/", {
        method: "POST",
        body: JSON.stringify({})
      });
      await loadAll();
    } catch {
      setStatus("error");
    }
  }

  async function createEmergencyShare() {
    setStatus("loading");
    try {
      await apiFetch<EmergencyShare>("/family-care/emergency-shares/", {
        method: "POST",
        body: JSON.stringify({ expires_in_hours: 72 })
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
                Family, Doctor, Emergency
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Share Health Context With Permission
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Manage care circles, generate doctor-ready summaries, and create
                time-limited emergency profile shares.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                Permission-first access
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access is role-based, revocable, audited, and limited by expiry.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">Family data</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Uses your signed-in MedClaro session for care circles, doctor summaries,
              and emergency shares.
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
              Load
            </button>
            {status === "error" ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check your session and required fields.
              </p>
            ) : null}
          </section>

          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={createCircle}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-claro-blue" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Care Circle
              </h2>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Circle name
              <input
                className={inputClass}
                value={circleName}
                onChange={(event) => setCircleName(event.target.value)}
              />
            </label>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
            >
              Create Circle
            </button>
          </form>

          <form
            className="rounded-md border border-slate-200 bg-white p-5"
            onSubmit={inviteMember}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-claro-mint" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Invite Member
              </h2>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Name
              <input
                className={inputClass}
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Email
              <input
                className={inputClass}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Role
              <select
                className={inputClass}
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              >
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="doctor">Doctor</option>
                <option value="caregiver">Caregiver</option>
                <option value="emergency_contact">Emergency Contact</option>
              </select>
            </label>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
            >
              Invite
            </button>
          </form>
        </aside>

        <section className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-claro-ink">
              Family Dashboard
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {circles.length === 0 ? (
                <Empty text="No care circles loaded yet." />
              ) : (
                circles.map((circle) => (
                  <article className="rounded-md border border-slate-200 p-4" key={circle.id}>
                    <h3 className="font-semibold text-claro-ink">{circle.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{circle.description}</p>
                    <div className="mt-4 space-y-3">
                      {circle.memberships.map((member) => (
                        <div className="rounded-md bg-slate-50 p-3" key={member.id}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-claro-ink">
                              {member.display_name}
                            </p>
                            <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                              {member.role}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{member.status}</p>
                          <p className="mt-2 text-xs text-slate-600">
                            {member.permission_grants.filter((grant) => grant.is_allowed).length} permissions
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Doctor Mode
                </h2>
              </div>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={generateDoctorSummary}
              >
                <FileHeart className="h-4 w-4" />
                Generate Summary
              </button>
              <div className="mt-4 space-y-3">
                {summaries.length === 0 ? (
                  <Empty text="No doctor summaries generated yet." />
                ) : (
                  summaries.map((summary) => (
                    <article className="rounded-md border border-slate-200 p-3" key={summary.id}>
                      <h3 className="font-semibold text-claro-ink">{summary.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {summary.model_name} - {summary.prompt_version}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        {summary.questions_for_doctor.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Emergency Mode
                </h2>
              </div>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={createEmergencyShare}
              >
                <QrCode className="h-4 w-4" />
                Create 72h Share
              </button>
              <div className="mt-4 space-y-3">
                {shares.length === 0 ? (
                  <Empty text="No emergency shares created yet." />
                ) : (
                  shares.map((share) => (
                    <article className="rounded-md border border-slate-200 p-3" key={share.id}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-claro-ink">{share.label}</h3>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                          {share.is_active ? "active" : "inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Expires {new Date(share.expires_at).toLocaleString()}
                      </p>
                      <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                        {JSON.stringify(share.qr_payload, null, 2)}
                      </pre>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
      {text}
    </p>
  );
}
