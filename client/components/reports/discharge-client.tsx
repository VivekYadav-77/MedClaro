"use client";

import { useRef, useState } from "react";
import { ClipboardCheck, FileText, Loader2, Plus, Upload } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type DischargeTask = {
  title: string;
  detail: string;
  status: "open" | "done";
  source: string;
};

export function DischargeClient() {
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<DischargeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function prepareChecklist() {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (notes.trim()) formData.append("notes", notes.trim());
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/discharge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not prepare checklist.");
      setTasks(payload.tasks ?? []);
      setMessage(payload.message ?? "Checklist prepared.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not prepare checklist.");
    } finally {
      setLoading(false);
    }
  }

  function addManualTask() {
    const title = manualTitle.trim();
    if (!title) return;
    setTasks((current) => [
      ...current,
      { title, detail: "Manual caregiver task. Edit in the next persistent version.", status: "open", source: "manual" },
    ]);
    setManualTitle("");
  }

  function toggleTask(index: number) {
    setTasks((current) =>
      current.map((task, taskIndex) => taskIndex === index ? { ...task, status: task.status === "done" ? "open" : "done" } : task)
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Discharge Tasks</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Post-op and discharge checklist</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload a discharge file or paste notes. The first version prepares a review checklist with local fallback extraction.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card className="space-y-4 p-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center hover:border-brand-300 hover:bg-brand-50"
          >
            <FileText className="mb-3 h-9 w-9 text-slate-400" />
            <span className="font-semibold text-slate-900">{file ? file.name : "Choose discharge PDF/image"}</span>
            <span className="mt-1 text-sm text-slate-500">Optional. You can paste notes instead.</span>
          </button>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Paste discharge advice, dressing instructions, follow-up dates, or medication changes..." />
          <Button className="w-full gap-2" onClick={() => void prepareChecklist()} disabled={loading || (!file && !notes.trim())}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Prepare checklist
          </Button>
          {message ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
        </Card>

        <section className="space-y-4">
          <Card className="flex gap-2 p-3">
            <input
              className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              value={manualTitle}
              onChange={(event) => setManualTitle(event.target.value)}
              placeholder="Add manual task"
            />
            <Button type="button" className="gap-2" onClick={addManualTask}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Card>

          {tasks.length ? (
            <div className="grid gap-3">
              {tasks.map((task, index) => (
                <button
                  key={`${task.title}-${index}`}
                  type="button"
                  onClick={() => toggleTask(index)}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-200"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border ${task.status === "done" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-slate-300 text-slate-400"}`}>
                      <ClipboardCheck className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">{task.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{task.detail}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-10 text-center">
              <ClipboardCheck className="mx-auto h-9 w-9 text-slate-300" />
              <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">No checklist yet</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a discharge file, paste notes, or add tasks manually.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
