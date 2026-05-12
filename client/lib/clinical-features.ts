import {
  Activity,
  AlertTriangle,
  Apple,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MessageCircle,
  Pill,
  QrCode,
  ScanSearch,
  ShieldAlert,
  ShoppingBasket,
  Stethoscope,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { ClinicalFeatureCard, FeatureStatus, MedicationRiskSummary, Parameter, Report, ScreeningTask } from "@/lib/types";

export const statusLabels: Record<FeatureStatus, string> = {
  live: "Live",
  needs_setup: "Needs setup",
  backend_pending: "Backend pending",
  no_data: "No data yet",
};

export const statusClasses: Record<FeatureStatus, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_setup: "border-amber-200 bg-amber-50 text-amber-800",
  backend_pending: "border-slate-200 bg-slate-100 text-slate-700",
  no_data: "border-sky-200 bg-sky-50 text-sky-800",
};

export const featureIcons: Record<string, LucideIcon> = {
  care_circles: ShieldAlert,
  guideline_alerts: TrendingUp,
  proactive_agent: Bot,
  ehr_export: FileText,
  medication_risk: Pill,
  conversational_logging: MessageCircle,
  emergency_ice: QrCode,
  wearable_sync: Activity,
  seasonal_grocery: ShoppingBasket,
  adherence_tracker: ClipboardCheck,
  lab_variance: ScanSearch,
  preventive_screening: CalendarCheck,
  generic_finder: Stethoscope,
  discharge_summary: FileText,
  remission_pathway: HeartPulse,
};

export function buildClinicalFeatureCards(reports: Report[], circleCount: number): ClinicalFeatureCard[] {
  const hasReports = reports.length > 0;
  const hasPrescription = reports.some((report) => report.reportType === "prescription" || (report.medications?.length ?? 0) > 0);
  const hasAbnormal = reports.some((report) => report.structuredData.some((item) => item.flag !== "normal"));
  const hasTrendData = collectTrackedMarkers(reports).length > 0;
  const latestReport = reports[0];
  const prescriptionReport = reports.find((report) => report.reportType === "prescription" || (report.medications?.length ?? 0) > 0);
  const abnormalReport = reports.find((report) => report.structuredData.some((item) => item.flag !== "normal"));
  const reportTabRoute = (report: Report | undefined, tab: string, fallback: string) =>
    report ? `/reports/${report._id}?tab=${tab}` : fallback;

  return [
    {
      id: "care_circles",
      title: "True Care Circles & Emergency SOS Protocol",
      shortTitle: "Care Circles",
      description: circleCount ? "Explicit sharing, roles, and free in-app SOS alerts are available." : "Create a circle before sharing records and sending free in-app SOS alerts.",
      status: circleCount ? "live" : "needs_setup",
      route: "/circles",
      actionLabel: circleCount ? "Manage roles" : "Create circle",
      category: "care",
    },
    {
      id: "guideline_alerts",
      title: "Clinical Guideline Alerts",
      shortTitle: "Guideline Alerts",
      description: hasTrendData ? "Trend and escalation review are available; formal ADA/AHA source packs remain a future enhancement." : "Upload repeat reports to unlock trend review.",
      status: hasTrendData ? "live" : "no_data",
      route: "/trends",
      actionLabel: "Review trends",
      category: "clinical",
    },
    {
      id: "proactive_agent",
      title: "Omni-Aware Assistant -> Proactive Push-Agent",
      shortTitle: "Push Agent",
      description: "Global assistant is live. Scheduled proactive nudges need notification worker/API support.",
      status: "backend_pending",
      route: "/assistant",
      actionLabel: "Open assistant",
      category: "daily",
    },
    {
      id: "ehr_export",
      title: "Doctor Visit Pre-Brief -> Standardized EHR Export",
      shortTitle: "EHR Export",
      description: hasReports ? "Doctor export UI and backend rows are available with local LOINC hints." : "Upload a report to prepare doctor export rows.",
      status: hasReports ? "live" : "no_data",
      route: reportTabRoute(latestReport, "doctor-export", "/reports/history?focus=ehr-export"),
      actionLabel: "Open report",
      category: "clinical",
    },
    {
      id: "medication_risk",
      title: "Medication Conflict -> Polypharmacy Risk Score",
      shortTitle: "Medication Risk",
      description: hasPrescription ? "Medication conflict API is live; anticholinergic burden scoring still needs terminology support." : "Upload prescriptions to calculate medication risk.",
      status: hasPrescription ? "live" : "no_data",
      route: hasPrescription ? "/reports/medications" : "/reports/upload?type=prescription&next=medication-risk",
      actionLabel: "Screen meds",
      category: "clinical",
    },
    {
      id: "conversational_logging",
      title: "Conversational Health Logging",
      shortTitle: "Manual Logging",
      description: "Free lifestyle logs are available in settings; paid messaging bots are not required.",
      status: "live",
      route: "/settings",
      actionLabel: "Log changes",
      category: "integration",
    },
    {
      id: "emergency_ice",
      title: "Emergency Card -> ICE Protocol & Paramedic Notification",
      shortTitle: "ICE Card",
      description: "Offline QR, audio broadcast, in-app SOS alerts, and scan logging are available in free mode.",
      status: "live",
      route: "/dashboard?panel=ice-card",
      actionLabel: "Check card",
      category: "safety",
    },
    {
      id: "wearable_sync",
      title: "Lifestyle Correlation -> Manual Health Import",
      shortTitle: "Health Import",
      description: "Import steps, sleep, heart rate, BP, and glucose manually without paid wearable APIs.",
      status: "live",
      route: "/settings",
      actionLabel: "Import",
      category: "integration",
    },
    {
      id: "seasonal_grocery",
      title: "Hyper-Local Diet -> Seasonal Grocery Cart Generator",
      shortTitle: "Grocery List",
      description: hasAbnormal ? "Diet advice and fallback food guidance can be generated from out-of-range markers." : "Needs out-of-range markers for grocery guidance.",
      status: hasAbnormal ? "live" : "no_data",
      route: reportTabRoute(abnormalReport, "diet", "/reports/history?focus=grocery"),
      actionLabel: "View diet",
      category: "daily",
    },
    {
      id: "adherence_tracker",
      title: "Treatment Pre-Screener -> Prescription Adherence Tracker",
      shortTitle: "Refill Tracker",
      description: hasPrescription ? "Prescription timing and refill prompts are available from saved prescription uploads." : "Upload a prescription to track refill risk.",
      status: hasPrescription ? "live" : "no_data",
      route: hasPrescription ? "/reports/medications?tab=refills" : "/reports/upload?type=prescription&next=refills",
      actionLabel: "Review refill",
      category: "daily",
    },
    {
      id: "lab_variance",
      title: "Lab Error / Variance Detection",
      shortTitle: "Lab Variance",
      description: hasTrendData ? "Repeat-marker delta rules flag improbable jumps for repeat-test discussion." : "Needs repeat values for the same marker.",
      status: hasTrendData ? "live" : "no_data",
      route: "/trends",
      actionLabel: "Inspect",
      category: "clinical",
    },
    {
      id: "preventive_screening",
      title: "Preventive Screening Scheduler",
      shortTitle: "Screening",
      description: "Profile-driven screening preview is available; persistent screening reminders remain a future enhancement.",
      status: "live",
      route: "/settings",
      actionLabel: "Review",
      category: "safety",
    },
    {
      id: "generic_finder",
      title: "Cost-Optimized Generic Medicine Finder",
      shortTitle: "Generic Finder",
      description: hasPrescription ? "Prescription medicines detected; generic price lookup endpoint is pending." : "Upload prescriptions to compare generic options.",
      status: hasPrescription ? "backend_pending" : "no_data",
      route: hasPrescription ? "/reports/medications?tab=generics" : "/reports/upload?type=prescription&next=generics",
      actionLabel: "Compare",
      category: "clinical",
    },
    {
      id: "discharge_summary",
      title: "Post-Op & Hospital Discharge Summarizer",
      shortTitle: "Discharge Tasks",
      description: "Upload discharge files or notes to prepare a caregiver checklist with local fallback extraction.",
      status: "live",
      route: "/reports/discharge",
      actionLabel: "Prepare",
      category: "care",
    },
    {
      id: "remission_pathway",
      title: "Chronic Disease Remission Pathways",
      shortTitle: "90-Day Pathway",
      description: hasAbnormal ? "Markers can seed a 90-day coaching pathway with weekly habits and marker goals." : "Upload qualifying markers such as HbA1c, liver, or BP records.",
      status: hasAbnormal ? "live" : "no_data",
      route: "/pathways",
      actionLabel: "View pathway",
      category: "daily",
    },
  ];
}

export function collectAbnormalMarkers(reports: Report[]) {
  return reports.flatMap((report) =>
    report.structuredData
      .filter((item) => item.flag !== "normal")
      .map((item) => ({ ...item, report }))
  );
}

export function collectTrackedMarkers(reports: Report[]) {
  const counts = new Map<string, number>();
  reports.forEach((report) => {
    report.structuredData.forEach((item) => {
      if (item.normalizedValue === undefined || item.normalizedValue === null) return;
      const key = item.testName.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
}

export function buildMedicationRiskSummary(reports: Report[]): MedicationRiskSummary {
  const medications = reports.flatMap((report) => report.medications ?? []).filter((item) => item.name);
  const medicationCount = new Set(medications.map((item) => item.name.toLowerCase())).size;
  const prescriptionReports = reports.filter((report) => report.reportType === "prescription" || (report.medications?.length ?? 0) > 0);
  const refillPrompts = prescriptionReports.slice(0, 3).map((report) => {
    const days = daysSince(report.reportDate || report.uploadDate);
    const names = (report.medications ?? []).map((item) => item.name).filter(Boolean).slice(0, 2).join(", ") || "this prescription";
    return `${names}: uploaded ${days} day${days === 1 ? "" : "s"} ago. Confirm refill if this was a 30-day course.`;
  });

  return {
    medicationCount,
    polypharmacyRisk: medicationCount >= 8 ? "high" : medicationCount >= 5 ? "moderate" : "low",
    anticholinergicBurdenStatus: medicationCount ? "backend_pending" : "no_data",
    refillPrompts,
  };
}

export function buildScreeningTasks(dob?: string, biologicalSex?: string | null): ScreeningTask[] {
  const age = dob ? ageFromDob(dob) : null;
  return [
    {
      title: "Colonoscopy",
      dueStatus: age === null ? "needs_profile" : age >= 45 ? "due" : "upcoming",
      reason: age === null ? "Add date of birth for schedule accuracy." : "Common preventive screening starts around age 45 for many adults.",
      actionLabel: "Add reminder",
    },
    {
      title: "Mammogram",
      dueStatus: biologicalSex === "female" ? (age !== null && age >= 40 ? "due" : "upcoming") : "not_applicable",
      reason: "Based on biological sex and age profile. Family history is not captured yet.",
      actionLabel: "Review",
    },
    {
      title: "DEXA bone density",
      dueStatus: age !== null && age >= 65 ? "due" : "upcoming",
      reason: "Age-based bone health screening placeholder until guideline backend is connected.",
      actionLabel: "Plan",
    },
  ];
}

export function loincHint(marker: string) {
  const key = marker.toLowerCase();
  if (key.includes("hemoglobin") && !key.includes("a1c")) return "718-7";
  if (key.includes("hba1c") || key.includes("a1c")) return "4548-4";
  if (key.includes("glucose")) return "2345-7";
  if (key.includes("ldl")) return "13457-7";
  if (key.includes("hdl")) return "2085-9";
  if (key.includes("triglyceride")) return "2571-8";
  if (key.includes("tsh")) return "3016-3";
  if (key.includes("creatinine")) return "2160-0";
  return "Mapping pending";
}

export function markerRisk(marker: Parameter) {
  if (marker.flag === "normal") return "normal";
  const value = typeof marker.value === "number" ? marker.value : Number(marker.value);
  const high = marker.referenceRangeHigh;
  const low = marker.referenceRangeLow;
  if (Number.isFinite(value) && typeof high === "number" && value > high * 1.25) return "high";
  if (Number.isFinite(value) && typeof low === "number" && value < low * 0.75) return "high";
  return "watch";
}

function ageFromDob(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

function daysSince(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}
