"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, LogIn, Plus, RefreshCw, SendHorizontal, Trash2, UsersRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { ActivityFeed } from "@/components/circles/activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotatingCode, setRotatingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const token = session?.accessToken;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void loadCircles();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    window.localStorage.setItem("selectedCircleId", selectedId);
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load circles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(circleId: string) {
    try {
      setMembers(await api<CircleMember[]>(`/circles/${circleId}/members`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load members.");
    }
  }

  async function loadFeed(circleId: string) {
    try {
      setFeed(await api<FeedEntry[]>(`/circles/${circleId}/feed`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load activity.");
    }
  }

  async function createCircle(event: FormEvent) {
    event.preventDefault();
    if (!newCircleName.trim()) return;
    try {
      const circle = await api<Circle>("/circles", {
        method: "POST",
        body: JSON.stringify({ name: newCircleName.trim() }),
      });
      setCircles((current) => [circle, ...current]);
      setSelectedId(circle.id);
      setNewCircleName("");
      setMessage("Circle created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create circle.");
    }
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !inviteEmail.trim() || selectedCircle?.myRole !== "admin") return;
    try {
      await api(`/circles/${selectedId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      setInviteEmail("");
      setMessage("Invite sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send invite.");
    }
  }

  async function joinByCode(event: FormEvent) {
    event.preventDefault();
    const cleanedCode = joinCode.trim().toUpperCase();
    if (!cleanedCode) return;
    try {
      const circle = await api<Circle>("/circles/join", {
        method: "POST",
        body: JSON.stringify({ code: cleanedCode }),
      });
      setCircles((current) => {
        const exists = current.some((item) => item.id === circle.id);
        return exists ? current.map((item) => (item.id === circle.id ? circle : item)) : [circle, ...current];
      });
      setSelectedId(circle.id);
      setJoinCode("");
      setMessage(`Joined ${circle.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join circle.");
    }
  }

  async function rotateJoinCode() {
    if (!selectedId) return;
    setRotatingCode(true);
    try {
      const circle = await api<Circle>(`/circles/${selectedId}/join-code/rotate`, {
        method: "POST",
      });
      setCircles((current) => current.map((item) => (item.id === circle.id ? circle : item)));
      setMessage("Circle code changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change circle code.");
    } finally {
      setRotatingCode(false);
    }
  }

  async function updateMemberRole(memberId: string, role: CircleMember["role"]) {
    if (!selectedId || selectedCircle?.myRole !== "admin") return;
    try {
      const updated = await api<CircleMember>(`/circles/${selectedId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setMembers((current) => current.map((member) => (member.id === memberId ? updated : member)));
      setMessage("Member role updated.");
      await loadFeed(selectedId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update member role.");
    }
  }

  async function removeMember(memberId: string) {
    if (!selectedId || selectedCircle?.myRole !== "admin") return;
    try {
      await api(`/circles/${selectedId}/members/${memberId}`, { method: "DELETE" });
      setMembers((current) => current.filter((member) => member.id !== memberId));
      setCircles((current) =>
        current.map((circle) =>
          circle.id === selectedId ? { ...circle, memberCount: Math.max(circle.memberCount - 1, 0) } : circle
        )
      );
      setMessage("Member removed.");
      await loadFeed(selectedId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove member.");
    }
  }

  const selectedCircle = circles.find((circle) => circle.id === selectedId);
  const canAdminister = selectedCircle?.myRole === "admin";

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
        <form onSubmit={joinByCode} className="flex gap-2">
          <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Join code" />
          <Button type="submit" size="icon" aria-label="Join circle">
            <LogIn className="h-4 w-4" />
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
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Circle code</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-mono text-lg font-semibold tracking-wider text-slate-900">
                    <KeyRound className="h-4 w-4 text-brand-600" />
                    {selectedCircle.joinCode ?? "Unavailable"}
                  </p>
                </div>
                {selectedCircle.myRole === "admin" ? (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void rotateJoinCode()} disabled={rotatingCode}>
                    {rotatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Change
                  </Button>
                ) : null}
              </div>
              {canAdminister ? (
                <form onSubmit={invite} className="flex gap-2">
                  <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Invite by email" />
                  <Button type="submit" className="gap-2">
                    <SendHorizontal className="h-4 w-4" />
                    Invite
                  </Button>
                </form>
              ) : null}
              <section className="space-y-3">
                <h2 className="font-semibold text-slate-900">Members</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{member.name}</p>
                          {!canAdminister ? <p className="text-xs text-slate-500">{member.role}</p> : null}
                        </div>
                        {canAdminister ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${member.name}`}
                            onClick={() => void removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        ) : null}
                      </div>
                      {canAdminister ? (
                        <Select
                          className="mt-3 h-9 rounded-xl"
                          value={member.role}
                          aria-label={`Role for ${member.name}`}
                          onChange={(event) => void updateMemberRole(member.id, event.target.value as CircleMember["role"])}
                        >
                          <option value="admin">Admin</option>
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </Select>
                      ) : null}
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
