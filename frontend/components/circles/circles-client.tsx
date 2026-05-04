"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Plus, SendHorizontal, UsersRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { ActivityFeed } from "@/components/circles/activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Circle, CircleMember, FeedEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function CirclesClient() {
  const { data: session } = useSession();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [newCircleName, setNewCircleName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const token = session?.accessToken;

  useEffect(() => {
    if (!token) return;
    void loadCircles();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    void Promise.all([loadMembers(selectedId), loadFeed(selectedId)]);
  }, [selectedId, token]);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    if (!API_URL) throw new Error("API URL not configured");
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? data?.message ?? "Request failed");
    return data as T;
  }

  async function loadCircles() {
    setLoading(true);
    try {
      const data = await api<Circle[]>("/circles");
      setCircles(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(circleId: string) {
    setMembers(await api<CircleMember[]>(`/circles/${circleId}/members`));
  }

  async function loadFeed(circleId: string) {
    setFeed(await api<FeedEntry[]>(`/circles/${circleId}/feed`));
  }

  async function createCircle(event: FormEvent) {
    event.preventDefault();
    if (!newCircleName.trim()) return;
    const circle = await api<Circle>("/circles", {
      method: "POST",
      body: JSON.stringify({ name: newCircleName.trim() }),
    });
    setCircles((current) => [circle, ...current]);
    setSelectedId(circle.id);
    setNewCircleName("");
    setMessage("Circle created.");
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !inviteEmail.trim()) return;
    await api(`/circles/${selectedId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });
    setInviteEmail("");
    setMessage("Invite sent.");
  }

  const selectedCircle = circles.find((circle) => circle.id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900">Care Circles</h2>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        <form onSubmit={createCircle} className="flex gap-2">
          <Input value={newCircleName} onChange={(event) => setNewCircleName(event.target.value)} placeholder="Circle name" />
          <Button type="submit" size="icon" aria-label="Create circle">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <div className="space-y-2">
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => setSelectedId(circle.id)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                selectedId === circle.id ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <span className="block font-medium text-slate-900">{circle.name}</span>
              <span className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <UsersRound className="h-3.5 w-3.5" />
                  {circle.memberCount} members
                </span>
                <Badge>{circle.myRole}</Badge>
              </span>
            </button>
          ))}
          {!loading && !circles.length ? <p className="text-sm text-slate-500">Create your first circle to invite family.</p> : null}
        </div>
      </Card>

      <div className="space-y-5">
        {message ? <p className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
        <Card className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{selectedCircle?.myRole ?? "Circle"}</p>
            <h1 className="font-display text-2xl font-bold text-slate-900">{selectedCircle?.name ?? "Select a circle"}</h1>
          </div>
          {selectedCircle ? (
            <>
              <form onSubmit={invite} className="flex gap-2">
                <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Invite by email" />
                <Button type="submit" className="gap-2">
                  <SendHorizontal className="h-4 w-4" />
                  Invite
                </Button>
              </form>
              <section className="space-y-3">
                <h2 className="font-semibold text-slate-900">Members</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </Card>
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold text-slate-900">Activity Feed</h2>
          <ActivityFeed entries={feed} />
        </Card>
      </div>
    </div>
  );
}
