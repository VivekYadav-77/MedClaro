"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  ClipboardCopy,
  FileText,
  HeartPulse,
  KeyRound,
  Loader2,
  LogIn,
  Pill,
  Plus,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ActivityFeed } from "@/components/circles/activity-feed";
import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { Timeline } from "@/components/dashboard/timeline";
import { TrendChart } from "@/components/reports/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoGrid } from "@/components/ui/bento-grid";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, Circle, CircleHealthDashboard, CircleMember, FeedEntry, Report } from "@/lib/types";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const roleDescriptions: Record<CircleMember["role"], string> = {
  admin: "Can invite people, manage roles, remove members, and coordinate shared care.",
  caregiver: "Can share reports and add health updates for the circle.",
  viewer: "Can view shared reports, trends, feed updates, and assistant answers.",
};

const dashboardTabs = ["Overview", "Trends", "Reports", "Assistant", "Members", "Activity"] as const;
type DashboardTab = (typeof dashboardTabs)[number];

export function CirclesClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [dashboard, setDashboard] = useState<CircleHealthDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("Overview");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotatingCode, setRotatingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

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
    void Promise.all([loadMembers(selectedId), loadFeed(selectedId), loadDashboard(selectedId)]);
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

  async function loadDashboard(circleId: string) {
    setDashboardLoading(true);
    try {
      setDashboard(await api<CircleHealthDashboard>(`/circles/${circleId}/health-dashboard`));
    } catch (error) {
      setDashboard(null);
      setMessage(error instanceof Error ? error.message : "Could not load circle dashboard.");
    } finally {
      setDashboardLoading(false);
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

  async function copyJoinCode() {
    if (!selectedCircle?.joinCode) return;
    await navigator.clipboard?.writeText(selectedCircle.joinCode);
    setMessage("Circle code copied.");
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
  const canContribute = selectedCircle?.myRole === "admin" || selectedCircle?.myRole === "caregiver";
  const visibleReports = dashboard?.reports ?? [];
  const activeWatchMarker = dashboard?.watchMarkers?.[0];
  const trendCount = dashboard?.trends?.series?.length ?? 0;
  const reportOwners = useMemo(
    () => new Set(visibleReports.map((report) => report.familyMemberName || report.ownerName || "Shared profile")).size,
    [visibleReports]
  );

  const handleUploaded = (report: Report) => {
    setUploadOpen(false);
    setMessage("Report added to this Care Circle.");
    if (selectedId) void Promise.all([loadDashboard(selectedId), loadFeed(selectedId)]);
    router.push(`/reports/${report._id}`);
  };

  return (
    <BentoGrid className="!grid-cols-1 lg:!grid-cols-[340px_1fr] gap-6">
      <BentoCard className="space-y-4 p-4 h-max">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Shared care</p>
            <h2 className="font-display text-xl font-bold text-slate-900">Care Circles</h2>
          </div>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm leading-6 text-teal-900">
          <ShieldCheck className="mb-2 h-4 w-4" />
          Invite only people who should see shared health records. Roles can be changed later by an admin.
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
                "w-full rounded-lg border p-3 text-left transition-colors",
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
          {!loading && !circles.length ? <p className="text-sm leading-6 text-slate-500">Create your first circle to invite family and share reports with explicit roles.</p> : null}
        </div>
      </BentoCard>

      <div className="space-y-5">
        {message ? <p className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
        <BentoCard className="space-y-4 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {selectedCircle?.myRole ?? "Circle"} command center
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
                {selectedCircle?.name ?? "Select a circle"}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Shared reports, trend history, medication signals, emergency activity, and an assistant scoped to this loved-one circle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canContribute ? (
                <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)} disabled={!selectedCircle}>
                  <Upload className="h-4 w-4" />
                  Add report
                </Button>
              ) : null}
              {dashboardLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-50 p-1">
            {dashboardTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  activeTab === tab ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:bg-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {!selectedCircle ? (
            <EmptyCirclePanel title="Select or create a circle" body="Choose a Care Circle on the left to open the health command center." />
          ) : activeTab === "Overview" ? (
            <CircleOverview
              dashboard={dashboard}
              reportOwners={reportOwners}
              activeWatchMarker={activeWatchMarker}
              trendCount={trendCount}
              onOpenReports={() => setActiveTab("Reports")}
              onOpenAssistant={() => setActiveTab("Assistant")}
            />
          ) : activeTab === "Trends" ? (
            <CircleTrends dashboard={dashboard} />
          ) : activeTab === "Reports" ? (
            <CircleReports
              reports={visibleReports}
              canContribute={canContribute}
              onUpload={() => setUploadOpen(true)}
              onSelectReport={(report) => router.push(`/reports/${report._id}`)}
            />
          ) : activeTab === "Assistant" ? (
            <CircleAssistant circleId={selectedId ?? ""} circleName={selectedCircle.name} context={dashboard?.healthContext ?? null} />
          ) : null}
        </BentoCard>

        {activeTab === "Members" ? (
        <BentoCard className="space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{selectedCircle?.myRole ?? "Circle"}</p>
            <h1 className="font-display text-2xl font-bold text-slate-900">{selectedCircle?.name ?? "Select a circle"}</h1>
          </div>
          {selectedCircle ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {(["admin", "caregiver", "viewer"] as CircleMember["role"][]).map((role) => (
                  <div key={role} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-brand-600" />
                      <p className="font-medium capitalize text-slate-900">{role}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{roleDescriptions[role]}</p>
                  </div>
                ))}
              </div>
              {canAdminister ? (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Circle code</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-mono text-lg font-semibold tracking-wider text-slate-900">
                    <KeyRound className="h-4 w-4 text-brand-600" />
                    {selectedCircle.joinCode ?? "Unavailable"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void copyJoinCode()} disabled={!selectedCircle.joinCode}>
                    <ClipboardCopy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void rotateJoinCode()} disabled={rotatingCode}>
                    {rotatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Change
                  </Button>
                </div>
              </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  Your role is <span className="font-semibold text-slate-900">{selectedCircle.myRole}</span>. Ask a circle admin if you need upload or invite access.
                </div>
              )}
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
                <div>
                  <h2 className="font-semibold text-slate-900">Members</h2>
                  <p className="text-sm text-slate-500">Keep roles conservative so every family member sees only what they need.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-lg border border-slate-200 p-3">
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
                          <option value="caregiver">Caregiver</option>
                          <option value="viewer">View-only</option>
                        </Select>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-brand-600" />
                  Shared reports
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Explicit report sharing is managed from each report drawer. Circle dashboards only show reports with active consent.
                </p>
              </section>
            </>
          ) : null}
        </BentoCard>
        ) : null}
        {activeTab === "Activity" ? (
        <BentoCard className="space-y-4 p-4">
          <h2 className="font-semibold text-slate-900">Activity Feed</h2>
          <ActivityFeed entries={dashboard?.feed ?? feed} />
        </BentoCard>
        ) : null}
      </div>
      {uploadOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setUploadOpen(false)}
            aria-label="Close upload modal"
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-dialog animate-scale-in">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Circle upload</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">Add a report to {selectedCircle?.name ?? "this circle"}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setUploadOpen(false)} aria-label="Close upload modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <InlineUploader
                onUploaded={handleUploaded}
                onViewReport={(report) => router.push(`/reports/${report._id}`)}
                circleId={selectedId}
              />
            </div>
          </div>
        </div>
      ) : null}
    </BentoGrid>
  );
}

function CircleOverview({
  dashboard,
  reportOwners,
  activeWatchMarker,
  trendCount,
  onOpenReports,
  onOpenAssistant,
}: {
  dashboard: CircleHealthDashboard | null;
  reportOwners: number;
  activeWatchMarker?: CircleHealthDashboard["watchMarkers"][number];
  trendCount: number;
  onOpenReports: () => void;
  onOpenAssistant: () => void;
}) {
  if (!dashboard) {
    return <EmptyCirclePanel title="No dashboard data yet" body="Share or upload reports into this circle to build a loved-one health view." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CircleMetric icon={FileText} label="Shared reports" value={String(dashboard.reports.length)} />
        <CircleMetric icon={UsersRound} label="Profiles visible" value={String(reportOwners)} />
        <CircleMetric icon={TrendingUp} label="Trend charts" value={String(trendCount)} />
        <CircleMetric icon={Pill} label="Medicines" value={String(dashboard.medicationSummary.medicationCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-amber-700">
                {activeWatchMarker ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {activeWatchMarker ? "Highest visible signal" : "No active marker flags"}
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  {activeWatchMarker
                    ? `${activeWatchMarker.ownerName ?? "Loved one"}: ${activeWatchMarker.testName} is ${activeWatchMarker.flag}`
                    : "Visible shared reports look calm"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {activeWatchMarker
                    ? `${activeWatchMarker.value} ${activeWatchMarker.unit} from ${activeWatchMarker.labName || "a shared report"}. Use this as a doctor discussion point.`
                    : "Keep adding repeat reports so trend, variance, and guideline modules can become more useful."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenReports} disabled={!dashboard.reports.length}>
              Review
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assistant context</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {dashboard.healthContext.reportCount} recent reports, {dashboard.healthContext.activeMedicationCount} medicines, and{" "}
            {dashboard.healthContext.watchMarkerCount} watch markers are ready for Circle-scoped questions.
          </p>
          <Button variant="soft" size="sm" className="mt-3 gap-2" onClick={onOpenAssistant}>
            <Bot className="h-4 w-4" />
            Ask assistant
          </Button>
        </div>
      </div>

      {dashboard.emergencyEvents.length ? (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-900">Emergency activity</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {dashboard.emergencyEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-900">
                <p className="font-semibold">{event.eventType.replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs">{new Date(event.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CircleTrends({ dashboard }: { dashboard: CircleHealthDashboard | null }) {
  const trends = dashboard?.trends;
  if (!trends?.series?.length) {
    return <EmptyCirclePanel title="No repeat trend data" body="Upload at least two comparable reports into this circle to unlock loved-one trend charts." />;
  }

  return (
    <div className="space-y-4">
      {trends.labVariance?.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-950">Lab variance checks</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {trends.labVariance.map((item) => (
              <div key={`${item.parameter}-${item.deltaPercent}`} className="rounded-md bg-white p-3 text-sm text-amber-950">
                <p className="font-semibold">{item.parameter}</p>
                <p className="mt-1 leading-6">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {trends.series.map((series) => (
          <TrendChart key={series.parameter} series={series} />
        ))}
      </div>
    </div>
  );
}

function CircleReports({
  reports,
  canContribute,
  onUpload,
  onSelectReport,
}: {
  reports: Report[];
  canContribute: boolean;
  onUpload: () => void;
  onSelectReport: (report: Report) => void;
}) {
  if (!reports.length) {
    return (
      <EmptyCirclePanel
        title="No shared reports yet"
        body={canContribute ? "Upload a loved-one report here, or share an existing private report from its Sharing tab." : "Ask an admin or caregiver to share reports with this circle."}
        action={canContribute ? { label: "Upload report", onClick: onUpload } : undefined}
      />
    );
  }
  return <Timeline reports={reports} onSelectReport={onSelectReport} />;
}

function CircleAssistant({
  circleId,
  circleName,
  context,
}: {
  circleId: string;
  circleName: string;
  context: CircleHealthDashboard["healthContext"] | null;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !API_URL || !session?.accessToken || loading) return;
    setMessages((current) => [...current, { role: "user", content: message, timestamp: new Date().toISOString() }]);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/reports/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ message, circleId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Assistant could not answer.");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data?.message ?? "I could not answer from saved reports.", timestamp: new Date().toISOString() },
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Assistant could not answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-h-[460px] flex-col overflow-hidden rounded-lg border border-slate-200">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-900">{circleName} assistant</h2>
          <p className="text-sm text-slate-500">Answers are scoped to reports explicitly visible in this Care Circle.</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
          {!messages.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "What should we watch for this loved one?",
                "Summarize the latest report for a caregiver.",
                "Which trends changed most?",
                "What should we ask the doctor next?",
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setDraft(question)}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-medium leading-6 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={cn(
                "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                message.role === "assistant" ? "bg-white text-slate-800" : "ml-auto bg-brand-600 text-white"
              )}
            >
              {message.content}
            </div>
          ))}
          {loading ? <p className="text-sm text-slate-500">Reviewing Circle context...</p> : null}
        </div>
        <form onSubmit={sendMessage} className="space-y-3 border-t border-slate-100 bg-white p-4">
          {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about shared reports, trends, medicines, or caregiver next steps..." />
          <div className="flex justify-end">
            <Button type="submit" disabled={!draft.trim() || loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              Send
            </Button>
          </div>
        </form>
      </div>

      <aside className="space-y-3">
        <CircleMetric icon={FileText} label="Reports in context" value={String(context?.reportCount ?? 0)} />
        <CircleMetric icon={Pill} label="Recent medicines" value={String(context?.activeMedicationCount ?? 0)} />
        <CircleMetric icon={AlertTriangle} label="Watch markers" value={String(context?.watchMarkerCount ?? 0)} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          The assistant helps prepare better questions. It should not replace emergency care or clinical decisions.
        </div>
      </aside>
    </div>
  );
}

function CircleMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 truncate font-display text-xl font-bold capitalize text-slate-950">{value}</p>
    </div>
  );
}

function EmptyCirclePanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
      <HeartPulse className="mx-auto h-9 w-9 text-slate-300" />
      <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{body}</p>
      {action ? (
        <Button className="mt-5 gap-2" onClick={action.onClick}>
          <Upload className="h-4 w-4" />
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
