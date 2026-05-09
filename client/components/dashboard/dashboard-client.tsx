"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, Plus, ShieldAlert, Sparkles, TrendingUp, Upload, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { EmergencyCard } from "@/components/dashboard/emergency-card";
import { RemindersPanel } from "@/components/dashboard/reminders-panel";
import { ReportDetailView } from "@/components/dashboard/report-detail-view";
import { Timeline } from "@/components/dashboard/timeline";
import { MilestoneToast } from "@/components/circles/milestone-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Circle, Report, UserProfile } from "@/lib/types";

export function DashboardClient({
  user,
  reports: initialReports
}: {
  user: UserProfile;
  reports: Report[];
}) {
  const { data: session } = useSession();
  const [reports, setReports] = useState(initialReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [timelineUpdating, setTimelineUpdating] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const firstName = user.name.split(" ")[0];

  const abnormalMarkers = useMemo(() => {
    return reports.flatMap((report) =>
      report.structuredData
        .filter((item) => item.flag !== "normal")
        .map((item) => ({ ...item, report }))
    );
  }, [reports]);
  const highestRiskReport = useMemo(
    () => [...reports].sort((a, b) => (b.aiExplanation?.attentionScore ?? 0) - (a.aiExplanation?.attentionScore ?? 0))[0],
    [reports]
  );
  const nextReminderCount = useMemo(() => reports.filter((report) => (report.aiExplanation?.attentionScore ?? 0) >= 3).length, [reports]);
  const activeCircleName = circles.find((circle) => circle.id === selectedCircleId)?.name;
  const contextLabel = selectedCircleId ? activeCircleName ?? "selected Care Circle" : selectedFamilyMemberId ? "selected family profile" : "my private reports";
  const primaryAlert = abnormalMarkers[0];

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/circles`, {
      headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      cache: "no-store"
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Circle[]) => {
        const storedCircleId = window.localStorage.getItem("selectedCircleId") ?? "";
        setCircles(data);
        setSelectedCircleId(data.some((circle) => circle.id === storedCircleId) ? storedCircleId : "");
      })
      .catch(() => setCircles([]));
  }, [session?.accessToken]);

  useEffect(() => {
    const loadScopedReports = async (memberId: string | null, circleId: string) => {
      setSelectedFamilyMemberId(memberId);
      if (!process.env.NEXT_PUBLIC_API_URL || (!memberId && !circleId)) {
        setReports(initialReports);
        return;
      }
      setTimelineUpdating(true);
      try {
        const params = new URLSearchParams();
        if (memberId) params.set("familyMemberId", memberId);
        if (circleId) params.set("circleId", circleId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports?${params.toString()}`, {
          headers: (session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : undefined,
          cache: "no-store"
        });
        if (response.ok) {
          setReports(await response.json());
        }
      } finally {
        setTimelineUpdating(false);
      }
    };

    void loadScopedReports(window.localStorage.getItem("selectedFamilyMemberId"), selectedCircleId);
    const onFamilyProfileChange = (event: Event) => {
      const memberId = (event as CustomEvent<{ memberId: string | null }>).detail?.memberId ?? null;
      void loadScopedReports(memberId, selectedCircleId);
    };
    window.addEventListener("family-profile-change", onFamilyProfileChange);
    return () => window.removeEventListener("family-profile-change", onFamilyProfileChange);
  }, [initialReports, selectedCircleId, session?.accessToken]);

  const clearFamilyFilter = () => {
    window.localStorage.removeItem("selectedFamilyMemberId");
    setSelectedFamilyMemberId(null);
    if (selectedCircleId) {
      window.dispatchEvent(new CustomEvent("family-profile-change", { detail: { memberId: null } }));
    } else {
      setReports(initialReports);
    }
  };

  const changeCircle = (circleId: string) => {
    setSelectedCircleId(circleId);
    if (circleId) {
      window.localStorage.setItem("selectedCircleId", circleId);
    } else {
      window.localStorage.removeItem("selectedCircleId");
    }
  };

  const handleUploaded = (report: Report) => {
    setReports((current) => [report, ...current.filter((item) => item._id !== report._id)]);
    setSelectedReport(report);
    setUploadOpen(false);
    const correlation = report.aiExplanation?.lifestyleCorrelation;
    const hasPositive = correlation?.correlations?.some((item) => item.impact === "positive");
    if (hasPositive && correlation?.overallMessage) {
      setToastMessage(`${correlation.overallMessage} Check your Circles feed.`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Good to see you,</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{firstName}'s Health Timeline</h1>
          <p className="mt-2 text-sm text-slate-500">A unified view of {contextLabel}.</p>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-80">
          {circles.length ? (
            <Select value={selectedCircleId} onChange={(event) => changeCircle(event.target.value)} aria-label="Care Circle report scope">
              <option value="">My private reports</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.name}
                </option>
              ))}
            </Select>
          ) : null}
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/trends">
              <Button variant="outline" size="sm" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Trends
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload Report
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-card">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-amber-50 via-white to-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              {primaryAlert ? <ShieldAlert className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                {primaryAlert ? "Action Required" : "Circle Health Snapshot"}
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900">
                {primaryAlert
                  ? `${primaryAlert.report.familyMemberName ?? primaryAlert.report.ownerName ?? firstName}'s ${primaryAlert.testName} is ${primaryAlert.flag}`
                  : "No out-of-range markers in the visible timeline"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {primaryAlert
                  ? `${primaryAlert.value} ${primaryAlert.unit} from ${primaryAlert.report.labName || "the latest visible report"}. Review this report or ask the assistant for context across ${contextLabel}.`
                  : `Everything visible in ${contextLabel} looks calm. Keep adding reports to improve longitudinal insight.`}
              </p>
              {selectedFamilyMemberId ? (
                <button className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={clearFamilyFilter}>
                  Clear family filter
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => primaryAlert && setSelectedReport(primaryAlert.report)} disabled={!primaryAlert}>
              <AlertTriangle className="h-4 w-4" />
              Review alert
            </Button>
            {selectedCircleId ? (
              <Link href="/circles">
                <Button variant="soft" size="sm" className="gap-1.5">
                  <UsersRound className="h-4 w-4" />
                  Manage roles
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={selectedCircleId ? "Circle Reports" : "Visible Reports"} value={String(reports.length)} sub={contextLabel} accent="brand" icon={UsersRound} />
        <StatCard
          label="Highest Attention"
          value={typeof highestRiskReport?.aiExplanation?.attentionScore === "number" ? `${highestRiskReport.aiExplanation.attentionScore}/5` : "--"}
          sub={highestRiskReport?.labName || "No reports yet"}
          accent="teal"
          icon={ShieldAlert}
        />
        <StatCard label="Follow-up Signals" value={String(nextReminderCount)} sub={`${abnormalMarkers.length} marker flags`} accent="amber" icon={CalendarClock} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-800">Report History</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Add report
              </Button>
            </div>
            {reports.length ? (
              <div className="relative">
                <div className={timelineUpdating ? "sr-only" : ""}>
                  <Timeline reports={reports} onSelectReport={setSelectedReport} />
                </div>
                {timelineUpdating ? <TimelineSkeleton /> : null}
              </div>
            ) : (
              timelineUpdating ? (
                <TimelineSkeleton />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-card">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                    <Upload className="h-7 w-7 text-brand-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">No reports yet</h3>
                  <p className="mt-1 text-sm text-slate-500">Upload your first blood report to get started with AI analysis.</p>
                  <Button className="mt-5 gap-2" onClick={() => setUploadOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Upload your first report
                  </Button>
                </div>
              )
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <EmergencyCard user={user} latestReport={reports[0] ?? null} />
          <RemindersPanel reports={reports} />

          <Card className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Actions</p>
            <div className="space-y-2">
              <button
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
                onClick={() => setUploadOpen(true)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">Upload a new report</span>
              </button>
              <Link href="/trends" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">View trend charts</span>
              </Link>
              <Link href="/family" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">Manage family profiles</span>
              </Link>
            </div>
          </Card>

        </aside>
      </div>

      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-dialog animate-scale-in">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Upload Report</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">Add analysis to {contextLabel}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setUploadOpen(false)} aria-label="Close upload modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <InlineUploader
                onUploaded={handleUploaded}
                onViewReport={setSelectedReport}
                onProcessingChange={setTimelineUpdating}
              />
            </div>
          </div>
        </div>
      ) : null}
      <ReportDetailView report={selectedReport} onClose={() => setSelectedReport(null)} />
      <MilestoneToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3" aria-label="Updating timeline">
      {[0, 1, 2].map((item) => (
        <Card key={item} className="flex animate-pulse items-start gap-4 p-4">
          <div className="h-11 w-11 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-full max-w-lg rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon
}: {
  label: string;
  value: string;
  sub: string;
  accent: "brand" | "teal" | "amber";
  icon: typeof UsersRound;
}) {
  const accents = {
    brand: "from-brand-600 via-sky-500 to-teal-400",
    teal: "from-teal-600 via-emerald-500 to-lime-400",
    amber: "from-amber-500 via-orange-500 to-rose-400"
  };

  return (
    <Card className={`group overflow-hidden border-0 bg-gradient-to-br ${accents[accent]} p-px transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover`}>
      <div className="flex h-full items-start gap-4 rounded-2xl bg-white/90 p-5 backdrop-blur">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
        </div>
      </div>
    </Card>
  );
}
