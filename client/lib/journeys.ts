import {
  Activity,
  ClipboardList,
  FileHeart,
  HeartPulse,
  Home,
  Pill,
  ShieldAlert,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Circle, Report, UserProfile } from "@/lib/types";

export type JourneyId = "home" | "reports" | "trends" | "medicines" | "family" | "doctor";

export type JourneyHub = {
  id: JourneyId;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type RelatedAction = {
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
  tone?: "brand" | "teal" | "amber" | "red" | "slate";
};

export const journeyHubs: JourneyHub[] = [
  {
    id: "home",
    label: "Home",
    shortLabel: "Home",
    href: "/dashboard",
    description: "Today’s priorities and next best action.",
    icon: Home,
  },
  {
    id: "reports",
    label: "Understand Reports",
    shortLabel: "Reports",
    href: "/reports/history",
    description: "Upload, read summaries, and prepare doctor handoffs.",
    icon: FileHeart,
  },
  {
    id: "trends",
    label: "Health Trends",
    shortLabel: "Trends",
    href: "/trends",
    description: "Repeat markers, trajectories, and lab variance.",
    icon: TrendingUp,
  },
  {
    id: "medicines",
    label: "Medicines",
    shortLabel: "Medicines",
    href: "/reports/medications",
    description: "Prescriptions, safety review, refills, and generics.",
    icon: Pill,
  },
  {
    id: "family",
    label: "Family Care",
    shortLabel: "Family",
    href: "/circles",
    description: "Care circles, shared reports, roles, and activity.",
    icon: UsersRound,
  },
  {
    id: "doctor",
    label: "Emergency & Doctor Visit",
    shortLabel: "Doctor/ICE",
    href: "/dashboard?panel=ice-card",
    description: "ICE card, SOS, printable summaries, and visit prep.",
    icon: ShieldAlert,
  },
];

export function getActiveJourney(pathname: string): JourneyId {
  if (pathname.startsWith("/reports/medications") || pathname.startsWith("/prescriptions")) return "medicines";
  if (pathname.startsWith("/reports") || pathname.startsWith("/dashboard?panel=doctor")) return "reports";
  if (pathname.startsWith("/trends") || pathname.startsWith("/pathways")) return "trends";
  if (pathname.startsWith("/circles") || pathname.startsWith("/family")) return "family";
  if (pathname.includes("ice-card")) return "doctor";
  return "home";
}

export function getNextBestAction({
  reports,
  user,
  circles,
}: {
  reports: Report[];
  user: UserProfile;
  circles: Circle[];
}): RelatedAction {
  if (!reports.length) {
    return {
      title: "Upload your first report",
      body: "Start the ecosystem by adding a blood report, prescription, or scan.",
      href: "/reports/upload",
      icon: FileHeart,
      tone: "brand",
    };
  }

  const latestReport = reports[0];
  const hasPrescription = reports.some((report) => report.reportType.includes("prescription") || (report.medications?.length ?? 0) > 0);
  const highAttention = reports.some((report) => (report.aiExplanation?.attentionScore ?? 0) >= 3);

  if (highAttention) {
    return {
      title: "Review the latest concern",
      body: "Open the simple summary and prepare a doctor question before changing any care plan.",
      href: `/reports/${latestReport._id}`,
      icon: ClipboardList,
      tone: "amber",
    };
  }

  if (!hasPrescription) {
    return {
      title: "Add current medicines",
      body: "Upload a prescription so medicine safety and treatment movement can connect to your reports.",
      href: "/reports/upload?type=prescription",
      icon: Pill,
      tone: "teal",
    };
  }

  if (reports.length < 2) {
    return {
      title: "Add an older report",
      body: "Two reports unlock trend movement, lab variance checks, and treatment effectiveness.",
      href: "/reports/upload",
      icon: TrendingUp,
      tone: "teal",
    };
  }

  if (!circles.length && user.familyMembers.length) {
    return {
      title: "Invite family care support",
      body: "Create a care circle so trusted caregivers can follow shared reports and activity.",
      href: "/circles",
      icon: UsersRound,
      tone: "brand",
    };
  }

  return {
    title: "Prepare for your next visit",
    body: "Use Doctor Summary, trends, medicines, and questions in one visit-prep flow.",
    href: `/reports/${latestReport._id}?tab=doctor-export`,
    icon: HeartPulse,
    tone: "red",
  };
}

export const reportRelatedActions: RelatedAction[] = [
  { title: "Check health trends", body: "See how repeat markers are moving over time.", href: "/trends", icon: TrendingUp, tone: "teal" },
  { title: "Review medicines", body: "Connect prescriptions, allergies, and report signals.", href: "/reports/medications?tab=risks", icon: Pill, tone: "brand" },
  { title: "Ask for help", body: "Ask the assistant using saved health context.", href: "/assistant", icon: Activity, tone: "slate" },
  { title: "Share with family", body: "Give a care circle access only with consent.", href: "/circles", icon: UsersRound, tone: "amber" },
];

export const medicineRelatedActions: RelatedAction[] = [
  { title: "Upload prescription", body: "Add the latest prescription before reviewing safety.", href: "/reports/upload?type=prescription", icon: Pill, tone: "brand" },
  { title: "Update allergies", body: "Allergy history improves medicine safety checks.", href: "/settings", icon: ShieldAlert, tone: "amber" },
  { title: "Check treatment movement", body: "Compare prescription timing against later report changes.", href: "/trends", icon: TrendingUp, tone: "teal" },
];

export const trendsRelatedActions: RelatedAction[] = [
  { title: "Upload repeat report", body: "More repeat data makes trends and variance checks stronger.", href: "/reports/upload", icon: FileHeart, tone: "brand" },
  { title: "Review medicines", body: "See whether prescription timing connects to marker movement.", href: "/reports/medications", icon: Pill, tone: "amber" },
  { title: "Prepare doctor summary", body: "Turn trend findings into visit-ready questions.", href: "/reports/history", icon: ClipboardList, tone: "teal" },
];

export const familyRelatedActions: RelatedAction[] = [
  { title: "Share a report", body: "Open a report and use Sharing to give explicit access.", href: "/reports/history", icon: FileHeart, tone: "brand" },
  { title: "Ask circle assistant", body: "Use shared reports and medicines as caregiver context.", href: "/assistant", icon: Activity, tone: "teal" },
  { title: "Emergency card", body: "Prepare ICE info and SOS for care circle moments.", href: "/dashboard?panel=ice-card", icon: ShieldAlert, tone: "red" },
];
