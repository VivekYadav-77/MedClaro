"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Activity,
  BellOff,
  Bone,
  CalendarCheck,
  MessageCircle,
  Save,
  Shield,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LifestyleLogsSection } from "@/app/(app)/settings/lifestyle-logs-section";
import { buildScreeningTasks } from "@/lib/clinical-features";
import { LanguageCode, UserProfile } from "@/lib/types";

export function SettingsClient({ user }: { user: UserProfile }) {
  const { data: session } = useSession();
  const [name, setName] = useState(user.name);
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(user.preferredLanguage);
  const [biologicalSex, setBiologicalSex] = useState(user.biologicalSex ?? "undisclosed");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const screeningTasks = buildScreeningTasks(user.dob, biologicalSex);

  const saveSettings = async () => {
    if (!process.env.NEXT_PUBLIC_API_URL || saving) return;
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...((session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : {})
        },
        body: JSON.stringify({ name, preferredLanguage, biologicalSex })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not save settings.");
      }
      setStatus("Settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Clinical setup</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">Profile, integrations, reminders & privacy</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Language selection changes UI copy and AI explanations. Inactivity signs you out after 15 minutes.
        </p>
      </div>

      <Card className="space-y-5 p-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <User className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Your email is stored encrypted.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <Input value={user.email} type="email" disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Preferred language</label>
            <Select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value as LanguageCode)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Biological sex</label>
            <Select value={biologicalSex} onChange={(event) => setBiologicalSex(event.target.value)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Other</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
          </div>
        </div>

        {status ? <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p> : null}
        {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button className="gap-2" onClick={() => void saveSettings()} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button variant="outline" className="gap-2">
            <BellOff className="h-4 w-4" />
            Mute nudges (30 days)
          </Button>
        </div>
      </Card>

      <LifestyleLogsSection />

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Smartphone className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Integrations</h2>
            <p className="text-xs text-slate-500">Free-mode setup with no paid messaging or wearable providers required.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <IntegrationCard icon={MessageCircle} title="Care Circle alerts" status="Free mode" body="Emergency alerts use in-app notifications for admins and caregivers, plus browser sharing for phone apps." />
          <IntegrationCard icon={Activity} title="Manual health import" status="Enabled" body="Import steps, sleep, heart rate, BP, and glucose from CSV or JSON without paid wearable APIs." />
          <IntegrationCard icon={Smartphone} title="Phone sharing" status="Browser native" body="Use your device share sheet to send emergency text through installed apps when supported." />
        </div>
      </Card>

      <HealthImportPanel token={(session as any)?.accessToken} />

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <CalendarCheck className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Preventive screening scheduler</h2>
            <p className="text-xs text-slate-500">Profile-derived schedule preview. Reminder backend is pending.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {screeningTasks.map((task) => (
            <div key={task.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{task.title}</p>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">{task.dueStatus.replace("_", " ")}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{task.reason}</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                {task.actionLabel} needs backend
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Bone className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Discharge checklists & remission pathways</h2>
            <p className="text-xs text-slate-500">Both modules are visible but wait for backend extraction and habit-tracking APIs.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PendingModule title="Post-op discharge checklist" body="Upload discharge PDFs, extract action items, and assign caregiver tasks once `/discharge-checklists` exists." />
          <PendingModule title="90-day remission pathway" body="Prediabetes, fatty liver, and hypertension coaching will use `/remission-pathways` for habits and marker goals." />
        </div>
      </Card>

      <Card className="space-y-4 border-red-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Danger Zone</h2>
            <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Hard delete removes your account, all uploaded reports, structured data, and chat history from our servers permanently.
        </p>
        <Button variant="danger" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete my account & all data
        </Button>
      </Card>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  status,
  body,
}: {
  icon: typeof Smartphone;
  title: string;
  status: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon className="h-4 w-4 text-brand-600" />
          {title}
        </span>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{status}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <Button variant="outline" size="sm" className="mt-3" disabled>
        Free mode
      </Button>
    </div>
  );
}

function HealthImportPanel({ token }: { token?: string }) {
  const [rawRows, setRawRows] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importRows() {
    if (!process.env.NEXT_PUBLIC_API_URL || !token || importing) return;
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const rows = parseHealthRows(rawRows);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wearables/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rows }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not import health metrics.");
      setResult(`Imported ${payload.importedCount ?? 0} row(s). ${payload.errorCount ?? 0} row(s) need correction.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import health metrics.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
          <Activity className="h-5 w-5 text-sky-700" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Manual health data import</h2>
          <p className="text-xs text-slate-500">Paste JSON or CSV rows from free device exports.</p>
        </div>
      </div>
      <textarea
        className="min-h-[150px] w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-400"
        value={rawRows}
        onChange={(event) => setRawRows(event.target.value)}
        placeholder={'metricType,value,unit,recordedAt,source\nsteps,8400,count,2026-05-11T08:00:00Z,manual\nsleep_minutes,420,min,2026-05-11T06:30:00Z,manual'}
      />
      {result ? <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{result}</p> : null}
      {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button className="gap-2" onClick={() => void importRows()} disabled={importing || !rawRows.trim()}>
          <Activity className="h-4 w-4" />
          {importing ? "Importing..." : "Import metrics"}
        </Button>
        <p className="text-xs text-slate-500">Allowed: steps, sleep_minutes, resting_heart_rate, blood_pressure_systolic, blood_pressure_diastolic, glucose.</p>
      </div>
    </Card>
  );
}

function parseHealthRows(rawRows: string) {
  const trimmed = rawRows.trim();
  if (!trimmed) throw new Error("Paste JSON or CSV rows first.");
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : parsed.rows;
  }
  const [headerLine, ...lines] = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((item) => item.trim());
  return lines.map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function PendingModule({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <Button variant="outline" size="sm" className="mt-3" disabled>
        Backend pending
      </Button>
    </div>
  );
}
