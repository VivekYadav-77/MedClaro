"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Pill,
  Plus,
  ShieldAlert,
  TrendingUp,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { InlineUploader } from "@/components/dashboard/inline-uploader";
import { EmergencyCard } from "@/components/dashboard/emergency-card";
import { RemindersPanel } from "@/components/dashboard/reminders-panel";
import { Timeline } from "@/components/dashboard/timeline";
import { MilestoneToast } from "@/components/circles/milestone-toast";
import { FeatureStatusGrid } from "@/components/clinical/feature-status-grid";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { BentoGrid } from "@/components/ui/bento-grid";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { buildClinicalFeatureCards, collectAbnormalMarkers } from "@/lib/clinical-features";
import { Circle, Report, UserProfile } from "@/lib/types";

export function DashboardClient({
  user,
  reports: initialReports
}: {
  user: UserProfile;
  reports: Report[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState(initialReports);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [timelineUpdating, setTimelineUpdating] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const firstName = user.name.split(" ")[0];

  const abnormalMarkers = useMemo(() => collectAbnormalMarkers(reports), [reports]);
  const highestRiskReport = useMemo(
    () => [...reports].sort((a, b) => (b.aiExplanation?.attentionScore ?? 0) - (a.aiExplanation?.attentionScore ?? 0))[0],
    [reports]
  );
  const nextReminderCount = useMemo(() => reports.filter((report) => (report.aiExplanation?.attentionScore ?? 0) >= 3).length, [reports]);
  const activeCircleName = circles.find((circle) => circle.id === selectedCircleId)?.name;
  const contextLabel = selectedCircleId ? activeCircleName ?? "selected Care Circle" : selectedFamilyMemberId ? "selected family profile" : "my private reports";
  const primaryAlert = abnormalMarkers[0];
  const features = useMemo(() => buildClinicalFeatureCards(reports, circles.length), [reports, circles.length]);
  const liveCount = features.filter((feature) => feature.status === "live").length;
  const pendingCount = features.filter((feature) => feature.status === "backend_pending").length;
  const dashboardPreviewReports = useMemo(() => reports.slice(0, 3), [reports]);

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

  useEffect(() => {
    if (searchParams.get("panel") !== "ice-card") return;
    window.setTimeout(() => {
      document.getElementById("ice-card-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [searchParams]);

  useEffect(() => {
    if (!uploadOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUploadOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [uploadOpen]);

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
    setUploadOpen(false);
    const correlation = report.aiExplanation?.lifestyleCorrelation;
    const hasPositive = correlation?.correlations?.some((item) => item.impact === "positive");
    if (hasPositive && correlation?.overallMessage) {
      setToastMessage(`${correlation.overallMessage} Check your Circles feed.`);
    }
    router.push(`/reports/${report._id}`);
  };

  const openReport = (report: Report, tab?: string) => {
    router.push(`/reports/${report._id}${tab ? `?tab=${tab}` : ""}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Clinical Command Center</p>
          <h1 className="font-display text-3xl font-bold text-slate-950 tracking-tight">{firstName}&apos;s family health operations</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            A comprehensive view of {contextLabel}: urgent markers, shared-care access, medication safety, and predictive health trajectories.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:min-w-[320px]">
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
              <Button variant="outline" className="gap-2 rounded-full px-5">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                Trends
              </Button>
            </Link>
            <Button className="gap-2 rounded-full px-5 shadow-sm" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload Report
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid */}
      <BentoGrid className="!grid-cols-1 md:!grid-cols-12 gap-5 md:gap-6 mt-6">
        
        {/* Urgent Alert Box (col 8) */}
        <BentoCard className="md:col-span-12 lg:col-span-8 flex flex-col justify-center bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${primaryAlert ? 'bg-amber-100 text-amber-700 shadow-inner' : 'bg-brand-50 text-brand-600'}`}>
                {primaryAlert ? <ShieldAlert className="h-6 w-6" /> : <ClipboardCheck className="h-6 w-6" />}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  {primaryAlert ? "Highest active signal" : "No urgent visible marker"}
                </p>
                <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900 leading-tight">
                  {primaryAlert
                    ? `${primaryAlert.report.familyMemberName ?? primaryAlert.report.ownerName ?? firstName}: ${primaryAlert.testName} is ${primaryAlert.flag}`
                    : `Everything visible in ${contextLabel} looks calm`}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 max-w-xl">
                  {primaryAlert
                    ? `${primaryAlert.value} ${primaryAlert.unit} from ${primaryAlert.report.labName || "latest visible report"}. Review before changing any care plan.`
                    : "Keep adding repeat reports so trend, variance, and guideline modules can become more useful."}
                </p>
                {selectedFamilyMemberId ? (
                  <button className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors" onClick={clearFamilyFilter}>
                    Clear family filter
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => primaryAlert && openReport(primaryAlert.report)} disabled={!primaryAlert}>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Review Flag
              </Button>
              <Link href="/assistant" className="w-full">
                <Button variant="soft" className="w-full gap-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100">
                  <Bot className="h-4 w-4" />
                  Ask AI
                </Button>
              </Link>
            </div>
          </div>
        </BentoCard>

        {/* Quick Stats: Visible Reports (col 4) */}
        <BentoCard className="md:col-span-6 lg:col-span-4 bg-slate-900 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <UsersRound className="h-5 w-5" />
            </span>
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{contextLabel}</p>
          </div>
          <div className="mt-6">
            <p className="font-display text-5xl font-bold tracking-tight">{reports.length}</p>
            <p className="mt-2 text-sm font-medium text-slate-300">Visible Reports</p>
          </div>
        </BentoCard>

        {/* Timeline Box (col 8, row span 2) */}
        <BentoCard className="md:col-span-12 lg:col-span-8 lg:row-span-2 flex flex-col">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">Report History</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/reports/analysis">
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-slate-600 hover:text-slate-900">
                  <FileText className="h-4 w-4" /> All reports
                </Button>
              </Link>
              <Link href="/prescriptions/analysis">
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-slate-600 hover:text-slate-900">
                  <Pill className="h-4 w-4" /> All prescriptions
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {reports.length ? (
              <div className="relative space-y-4">
                <div className={timelineUpdating ? "sr-only" : ""}>
                  <Timeline reports={dashboardPreviewReports} onSelectReport={(report) => openReport(report)} />
                </div>
                {timelineUpdating ? <TimelineSkeleton /> : null}
              </div>
            ) : (
              timelineUpdating ? (
                <TimelineSkeleton />
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">No reports yet</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm">Upload your first blood report or prescription to start building your health timeline.</p>
                  <Button className="mt-6 gap-2 rounded-xl" onClick={() => setUploadOpen(true)}>
                    <Plus className="h-4 w-4" /> Upload Report
                  </Button>
                </div>
              )
            )}
          </div>
        </BentoCard>

        {/* Emergency Card Box (col 4, row span 2) */}
        <BentoCard id="ice-card-panel" noPadding className="md:col-span-6 lg:col-span-4 lg:row-span-2 scroll-mt-24 h-full bg-slate-50/50">
           <EmergencyCard user={user} reports={reports} latestReport={reports[0] ?? null} circleId={selectedCircleId} />
        </BentoCard>

        {/* Action Panel Box (col 4) */}
        <BentoCard className="md:col-span-6 lg:col-span-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Actions</p>
          <div className="space-y-3">
            <button
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
              onClick={() => setUploadOpen(true)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-700">Upload new document</span>
            </button>
            <Link href="/trends" className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-teal-200 hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-700">View trend charts</span>
            </Link>
            <Link href="/family" className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                <UsersRound className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-700">Manage Care Circles</span>
            </Link>
          </div>
        </BentoCard>

        {/* Reminders Panel Box (col 8) */}
        <BentoCard className="md:col-span-12 lg:col-span-8 h-full">
           <RemindersPanel reports={reports} />
        </BentoCard>

      </BentoGrid>

      <div className="mt-8">
         <FeatureStatusGrid features={features} title="Feature readiness across Featurefix.md" />
      </div>

      {uploadOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="dashboard-upload-title">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setUploadOpen(false)}
            aria-label="Close upload modal"
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-dialog animate-scale-in">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Upload Report</p>
                <h2 id="dashboard-upload-title" className="mt-1.5 font-display text-2xl font-bold text-slate-900">Add analysis to {contextLabel}</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 hover:bg-slate-100" onClick={() => setUploadOpen(false)} aria-label="Close upload modal">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <InlineUploader
                onUploaded={handleUploaded}
                onViewReport={(report) => openReport(report)}
                onProcessingChange={setTimelineUpdating}
              />
            </div>
          </div>
        </div>
      ) : null}
      <MilestoneToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function CommandMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UsersRound;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 truncate font-display text-xl font-bold capitalize text-slate-950">{value}</p>
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
