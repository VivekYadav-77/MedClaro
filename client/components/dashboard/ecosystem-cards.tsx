import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileHeart,
  Pill,
  ShieldAlert,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Circle, Report, UserProfile } from "@/lib/types";

export function LatestReportCard({ report }: { report?: Report }) {
  return (
    <EcosystemCard
      icon={FileHeart}
      eyebrow="Understand Reports"
      title={report ? report.labName || "Latest health report" : "Start with a report"}
      body={report ? "This report powers summaries, trends, medicines, assistant answers, and doctor prep." : "Upload one report to start the health ecosystem."}
      href={report ? `/reports/${report._id}` : "/reports/upload"}
      action={report ? "Read summary" : "Upload report"}
    />
  );
}

export function MedicineSafetyCard({ reports }: { reports: Report[] }) {
  const medicineCount = reports.reduce((count, report) => count + (report.medications?.filter((item) => item.name).length ?? 0), 0);
  return (
    <EcosystemCard
      icon={Pill}
      eyebrow="Medicines"
      title={medicineCount ? `${medicineCount} medicine detail${medicineCount === 1 ? "" : "s"} found` : "Add current medicines"}
      body="Prescriptions connect to allergies, report markers, refill timing, and treatment movement."
      href={medicineCount ? "/reports/medications?tab=risks" : "/reports/upload?type=prescription"}
      action={medicineCount ? "Run safety review" : "Upload prescription"}
    />
  );
}

export function TrendReadinessCard({ reports }: { reports: Report[] }) {
  const ready = reports.length >= 2;
  return (
    <EcosystemCard
      icon={TrendingUp}
      eyebrow="Health Trends"
      title={ready ? "Trend checks are ready" : "Add repeat data"}
      body={ready ? "Compare marker movement, lab variance, and treatment effectiveness." : "Two comparable reports unlock useful trend movement."}
      href={ready ? "/trends" : "/reports/upload"}
      action={ready ? "View trends" : "Upload another report"}
    />
  );
}

export function FamilyCareCard({ user, circles }: { user: UserProfile; circles: Circle[] }) {
  return (
    <EcosystemCard
      icon={UsersRound}
      eyebrow="Family Care"
      title={circles.length ? `${circles.length} care circle${circles.length === 1 ? "" : "s"}` : "Coordinate with caregivers"}
      body={circles.length ? "Shared reports, caregiver roles, activity, and circle assistant are connected." : `${user.familyMembers.length} family profile${user.familyMembers.length === 1 ? "" : "s"} can be organized into care circles.`}
      href="/circles"
      action={circles.length ? "Open family care" : "Create care circle"}
    />
  );
}

export function EmergencyReadinessCard({ reports }: { reports: Report[] }) {
  const hasContext = reports.some((report) => (report.medications?.length ?? 0) > 0 || report.structuredData.some((item) => item.flag !== "normal"));
  return (
    <EcosystemCard
      icon={ShieldAlert}
      eyebrow="Emergency & ICE"
      title={hasContext ? "Emergency card has context" : "Prepare emergency info"}
      body="ICE card uses medicines, abnormal markers, QR, SOS, family alerts, and audio broadcast."
      href="/dashboard?panel=ice-card"
      action="Open ICE card"
      urgent
    />
  );
}

export function DoctorVisitCard({ report }: { report?: Report }) {
  return (
    <EcosystemCard
      icon={ClipboardList}
      eyebrow="Doctor Visit"
      title="Prepare a visit brief"
      body="Turn summaries, lab values, trends, medicines, and questions into a doctor-ready flow."
      href={report ? `/reports/${report._id}?tab=doctor-export` : "/reports/history"}
      action={report ? "Open doctor summary" : "Choose report"}
    />
  );
}

function EcosystemCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  href,
  action,
  urgent,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  action: string;
  urgent?: boolean;
}) {
  return (
    <BentoCard className={`flex h-full flex-col justify-between p-5 ${urgent ? "border-red-100 bg-red-50/40" : "bg-white"}`}>
      <div className="space-y-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${urgent ? "bg-red-100 text-red-700" : "bg-brand-50 text-brand-700"}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-600">{eyebrow}</p>
          <h3 className="mt-1 font-display text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-base leading-7 text-slate-700">{body}</p>
        </div>
      </div>
      <Link href={href} className="mt-5 inline-flex">
        <Button variant={urgent ? "danger" : "outline"} className="gap-2 rounded-lg bg-white">
          {action}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </BentoCard>
  );
}
