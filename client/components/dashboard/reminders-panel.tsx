"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, CalendarPlus, ChevronDown, Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Reminder, Report } from "@/lib/types";

export function RemindersPanel({ reports }: { reports: Report[] }) {
  const { data: session } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reportId, setReportId] = useState(reports[0]?._id ?? "");
  const [reminderDate, setReminderDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportLookup = useMemo(() => new Map(reports.map((report) => [report._id, report])), [reports]);

  const apiHeaders = {
    "Content-Type": "application/json",
    ...((session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : {})
  };

  const loadReminders = async () => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reminders`, {
        headers: apiHeaders,
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Could not load reminders.");
      setReminders(await response.json());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReminders();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!reportId && reports[0]?._id) setReportId(reports[0]._id);
  }, [reportId, reports]);

  const createReminder = async () => {
    if (!process.env.NEXT_PUBLIC_API_URL || !reportId || !reminderDate || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reminders`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ reportId, reminderDate: new Date(reminderDate).toISOString() })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not create reminder.");
      }
      const reminder = await response.json();
      setReminders((current) => [reminder, ...current.filter((item) => item._id !== reminder._id)]);
      setReminderDate("");
      setFormOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create reminder.");
    } finally {
      setSaving(false);
    }
  };

  const muteReminder = async (reminderId: string) => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reminders/${reminderId}/mute`, {
        method: "PUT",
        headers: apiHeaders
      });
      if (!response.ok) throw new Error("Could not mute reminder.");
      setReminders((current) => current.filter((item) => item._id !== reminderId));
    } catch (muteError) {
      setError(muteError instanceof Error ? muteError.message : "Could not mute reminder.");
    }
  };

  return (
    <Card className="space-y-4 border-l-4 border-l-amber-400 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Smart Reminders</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-amber-700 hover:bg-amber-50" onClick={() => setFormOpen((value) => !value)}>
          {formOpen ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {formOpen ? (
        <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 animate-slide-up">
          <select
            className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-700"
            value={reportId}
            onChange={(event) => setReportId(event.target.value)}
            disabled={!reports.length}
          >
            {reports.map((report) => (
              <option key={report._id} value={report._id}>
                {report.labName || report.reportType}
              </option>
            ))}
          </select>
          <Input type="datetime-local" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
          <Button className="w-full gap-2" onClick={() => void createReminder()} disabled={!reports.length || !reminderDate || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Save reminder
          </Button>
        </div>
      ) : null}

      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading reminders...</p>
        ) : reminders.length ? (
          reminders.map((reminder) => (
            <div key={reminder._id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {reportLookup.get(reminder.reportId)?.labName ?? "Report follow-up"}
                </p>
                <p className="text-xs text-amber-900">{new Date(reminder.reminderDate).toLocaleString()}</p>
              </div>
              <button
                type="button"
                className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900"
                onClick={() => void muteReminder(reminder._id)}
                aria-label="Mute reminder"
              >
                <BellOff className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm leading-relaxed text-slate-600">
            No active reminders yet.
          </div>
        )}
      </div>
    </Card>
  );
}
