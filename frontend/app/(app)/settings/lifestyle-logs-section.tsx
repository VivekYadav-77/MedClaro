"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LifestyleLog = { id: string; note: string; loggedAt: string };

export function LifestyleLogsSection() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LifestyleLog[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    void loadLogs();
  }, [session?.accessToken]);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    if (!process.env.NEXT_PUBLIC_API_URL) throw new Error("Missing API URL");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? "Request failed");
    return data as T;
  }

  async function loadLogs() {
    setLogs(await api<LifestyleLog[]>("/lifestyle-logs"));
  }

  async function addLog(event: FormEvent) {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const log = await api<LifestyleLog>("/lifestyle-logs", {
        method: "POST",
        body: JSON.stringify({ note: trimmed }),
      });
      setLogs((current) => [log, ...current]);
      setNote("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add log.");
    }
  }

  async function removeLog(id: string) {
    await api(`/lifestyle-logs/${id}`, { method: "DELETE" });
    setLogs((current) => current.filter((log) => log.id !== id));
  }

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="font-semibold text-slate-900">Lifestyle Tracker</h2>
        <p className="mt-1 text-sm text-slate-500">Track changes you want future reports to compare against.</p>
      </div>
      <form onSubmit={addLog} className="flex gap-2">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={200}
          placeholder="Started walking 30 min daily"
        />
        <Button type="submit" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {logs.map((log) => (
          <span key={log.id} className="inline-flex max-w-full items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
            <span className="truncate">{log.note}</span>
            <button type="button" onClick={() => void removeLog(log.id)} aria-label={`Remove ${log.note}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {!logs.length ? <p className="text-sm text-slate-500">No lifestyle notes yet.</p> : null}
      </div>
    </Card>
  );
}
