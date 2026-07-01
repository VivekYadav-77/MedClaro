"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  Pill,
  RefreshCw,
  Settings2,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { BentoGrid } from "@/components/ui/bento-grid";
import { RelatedActions } from "@/components/journeys/related-actions";
import { medicineRelatedActions } from "@/lib/journeys";
import { PrescriptionRecord, PrescriptionRiskAnalysis, PrescriptionRiskFinding, RiskSeverity } from "@/lib/types";

type RefillPrompt = {
  reportId: string;
  medications: string[];
  daysSinceUpload: number;
  risk: "normal" | "watch" | "high";
  message: string;
};

type GenericOption = {
  originalName: string;
  genericName: string;
  className: string;
  confidence: "matched" | "review";
  note: string;
  sourcePrescription: PrescriptionRecord;
};

const GENERIC_GUIDE = [
  {
    genericName: "Paracetamol / Acetaminophen",
    aliases: ["paracetamol", "acetaminophen", "dolo", "calpol", "crocin"],
    className: "Pain and fever medicine",
    note: "Confirm total daily dose and avoid accidentally combining multiple cold/fever products with the same ingredient.",
  },
  {
    genericName: "Ibuprofen",
    aliases: ["ibuprofen", "brufen", "advil", "nurofen"],
    className: "NSAID pain medicine",
    note: "Ask whether it is suitable with kidney, acidity/ulcer, blood pressure, blood thinner, or pregnancy context.",
  },
  {
    genericName: "Diclofenac",
    aliases: ["diclofenac", "voveran", "cataflam"],
    className: "NSAID pain medicine",
    note: "Check whether a safer pain option is preferred if kidney, stomach, heart, or blood pressure risks are present.",
  },
  {
    genericName: "Aspirin",
    aliases: ["aspirin", "ecosprin", "disprin"],
    className: "Antiplatelet / pain medicine",
    note: "Confirm the exact reason and dose because low-dose heart protection and pain dosing are reviewed differently.",
  },
  {
    genericName: "Atorvastatin",
    aliases: ["atorvastatin", "atorva", "lipitor"],
    className: "Statin cholesterol medicine",
    note: "Confirm strength, timing, and whether liver enzyme or muscle symptom review is needed.",
  },
  {
    genericName: "Rosuvastatin",
    aliases: ["rosuvastatin", "rozavel", "crestor", "rosuvas"],
    className: "Statin cholesterol medicine",
    note: "Confirm strength and whether kidney function or muscle symptom review changes monitoring needs.",
  },
  {
    genericName: "Metformin",
    aliases: ["metformin", "glucophage", "glycomet"],
    className: "Diabetes medicine",
    note: "Ask whether kidney function, stomach tolerance, and extended-release versus immediate-release form are appropriate.",
  },
  {
    genericName: "Glimepiride",
    aliases: ["glimepiride", "amaryl", "glypride"],
    className: "Diabetes medicine",
    note: "Review meal timing and low-sugar risk, especially when doses or eating patterns change.",
  },
  {
    genericName: "Levothyroxine",
    aliases: ["levothyroxine", "thyroxine", "thyronorm", "eltroxin"],
    className: "Thyroid hormone",
    note: "Confirm empty-stomach timing and separation from calcium, iron, antacids, or multivitamins.",
  },
  {
    genericName: "Amlodipine",
    aliases: ["amlodipine", "amlong", "norvasc", "amlor"],
    className: "Blood pressure medicine",
    note: "Ask whether ankle swelling, dizziness, and dose strength need review.",
  },
  {
    genericName: "Telmisartan",
    aliases: ["telmisartan", "telma", "telsar", "micardis"],
    className: "ARB blood pressure medicine",
    note: "Confirm kidney function and potassium monitoring, especially if paired with diuretics or ACE/ARB medicines.",
  },
  {
    genericName: "Losartan",
    aliases: ["losartan", "losar", "cozaar"],
    className: "ARB blood pressure medicine",
    note: "Confirm kidney function and potassium monitoring when reports show kidney or electrolyte changes.",
  },
  {
    genericName: "Ramipril",
    aliases: ["ramipril", "cardace", "altace"],
    className: "ACE inhibitor blood pressure medicine",
    note: "Ask about potassium, kidney function, cough, and whether it overlaps with any ARB medicine.",
  },
  {
    genericName: "Pantoprazole",
    aliases: ["pantoprazole", "pantocid", "pan 40", "protonix"],
    className: "Acidity / reflux medicine",
    note: "Confirm duration and whether long-term use needs magnesium, B12, or bone-health discussion.",
  },
  {
    genericName: "Omeprazole",
    aliases: ["omeprazole", "omez", "prilosec"],
    className: "Acidity / reflux medicine",
    note: "Confirm timing before meals and whether it affects any other medicine schedule.",
  },
  {
    genericName: "Cetirizine",
    aliases: ["cetirizine", "cetzine", "zyrtec"],
    className: "Antihistamine allergy medicine",
    note: "Ask about sleepiness and whether driving or work timing matters.",
  },
  {
    genericName: "Montelukast",
    aliases: ["montelukast", "montek", "singulair"],
    className: "Allergy / asthma controller",
    note: "Confirm why it was prescribed and discuss mood or sleep changes if they occur.",
  },
  {
    genericName: "Azithromycin",
    aliases: ["azithromycin", "azee", "zithromax"],
    className: "Antibiotic",
    note: "Confirm course duration, indication, and whether heart rhythm or interaction risks need review.",
  },
  {
    genericName: "Amoxicillin + Clavulanate",
    aliases: ["amoxicillin clavulanate", "amoxycillin clavulanate", "augmentin", "clavam"],
    className: "Antibiotic combination",
    note: "Check penicillin allergy history and confirm the exact course length.",
  },
  {
    genericName: "Cefixime",
    aliases: ["cefixime", "taxim-o", "zifi"],
    className: "Antibiotic",
    note: "Confirm course duration and allergy history before comparing brands.",
  },
  {
    genericName: "Furosemide",
    aliases: ["furosemide", "frusemide", "lasix"],
    className: "Diuretic",
    note: "Ask about kidney function, sodium/potassium, swelling, blood pressure, and dehydration symptoms.",
  },
  {
    genericName: "Clopidogrel",
    aliases: ["clopidogrel", "clopilet", "plavix"],
    className: "Antiplatelet",
    note: "Confirm bleeding-risk review and whether it is paired with aspirin or a blood thinner.",
  },
  {
    genericName: "Warfarin",
    aliases: ["warfarin", "coumadin"],
    className: "Anticoagulant",
    note: "Do not substitute casually; INR monitoring, diet, antibiotics, and brand consistency matter.",
  },
  {
    genericName: "Apixaban",
    aliases: ["apixaban", "eliquis"],
    className: "Anticoagulant",
    note: "Confirm dose, kidney function, and bleeding-risk review before any brand/generic change.",
  },
  {
    genericName: "Rivaroxaban",
    aliases: ["rivaroxaban", "xarelto"],
    className: "Anticoagulant",
    note: "Confirm dose timing with food where applicable and review kidney function and bleeding risk.",
  },
];

export function MedicationsClient({
  eyebrow = "Medication Center",
  title = "Medication safety center",
  description = "Keep prescriptions organized, check for medicine clashes, add allergies, and connect reports for safer clinician review.",
  basePath = "/reports/medications",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  basePath?: string;
}) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [refills, setRefills] = useState<RefillPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get("tab") ?? "overview";

  async function load() {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [prescriptionResponse, adherenceResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/adherence`, { headers, cache: "no-store" }),
      ]);
      const prescriptionPayload = await prescriptionResponse.json().catch(() => null);
      const adherencePayload = await adherenceResponse.json().catch(() => null);
      setPrescriptions(prescriptionResponse.ok ? prescriptionPayload.prescriptions ?? [] : []);
      setRefills(adherenceResponse.ok ? adherencePayload.prompts ?? [] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [session?.accessToken]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <BentoCard className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-gradient-to-r from-brand-50 to-white border-brand-100/50">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 font-medium">{description}</p>
        </div>
        <Link href="/reports/upload?type=prescription">
          <Button className="gap-2 rounded-xl">
            <Pill className="h-4 w-4" />
            Add prescription
          </Button>
        </Link>
      </BentoCard>

      <div className="flex flex-wrap gap-2">
        <TabLink href={basePath} label="Overview" active={activeTab === "overview"} />
        <TabLink href={`${basePath}?tab=risks`} label="Safety Review" active={activeTab === "risks"} />
        <TabLink href={`${basePath}?tab=refills`} label="Refills" active={activeTab === "refills"} />
        <TabLink href={`${basePath}?tab=generics`} label="Generics" active={activeTab === "generics"} />
        <Button variant="ghost" size="sm" onClick={() => void load()} className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <BentoCard className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500 min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="font-medium text-slate-600">Loading prescriptions...</span>
        </BentoCard>
      ) : activeTab === "risks" ? (
        <RiskCheckPanel token={session?.accessToken as string | undefined} />
      ) : activeTab === "refills" ? (
        <RefillList prompts={refills} />
      ) : activeTab === "generics" ? (
        <GenericOptionsPanel prescriptions={prescriptions} />
      ) : (
        <PrescriptionList prescriptions={prescriptions} />
      )}

      <RelatedActions title="Connect medicines to the wider health picture" actions={medicineRelatedActions} />
    </div>
  );
}

function RiskCheckPanel({ token }: { token?: string }) {
  const [analysis, setAnalysis] = useState<PrescriptionRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(recalculate = false) {
    if (!process.env.NEXT_PUBLIC_API_URL || !token) {
      setLoading(false);
      setAnalysis(null);
      return;
    }
    setError("");
    setRefreshing(recalculate);
    if (!recalculate) setLoading(true);
    try {
      const familyMemberId = window.localStorage.getItem("selectedFamilyMemberId");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const response = recalculate
        ? await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/risk-analysis`, {
            method: "POST",
            headers,
            body: JSON.stringify({ familyMemberId }),
          })
        : await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/risk-analysis${familyMemberId ? `?familyMemberId=${familyMemberId}` : ""}`,
            { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
          );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not run prescription risk analysis.");
      }
      setAnalysis(payload as PrescriptionRiskAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run prescription risk analysis.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, [token]);

  if (loading) {
    return (
      <BentoCard className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500 min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <span className="font-medium text-slate-600">Checking prescription risks...</span>
      </BentoCard>
    );
  }

  return (
    <div className="space-y-5">
      <BentoCard className={`p-6 ${analysis?.severity === "high" ? "border-rose-200 bg-rose-50/60" : analysis?.severity === "watch" ? "border-amber-200 bg-amber-50/50" : "bg-slate-50/50"}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${analysis?.severity === "high" ? "bg-rose-100 text-rose-700" : analysis?.severity === "watch" ? "bg-amber-100 text-amber-700" : "bg-white text-brand-700 border border-brand-100"}`}>
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Medication Safety Review</p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-900">{analysis ? safetyHeadline(analysis) : "Check prescription clashes, allergies, and report signals"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium max-w-2xl">
                {analysis ? safetySummaryText(analysis) : "Run a guided review using active prescriptions, saved allergies, and analyzed report markers."}
              </p>
              {analysis ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={severityVariant(analysis.severity)} className="rounded-md px-2.5 py-1">{severityLabel(analysis.severity)}</Badge>
                  <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{analysis.confidence} confidence</Badge>
                  <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{analysis.medicineCount} medicine(s)</Badge>
                  <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{analysis.reportCount} report(s)</Badge>
                  <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{analysis.allergies.length} allerg{analysis.allergies.length === 1 ? "y" : "ies"}</Badge>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link href="/settings">
              <Button variant="outline" className="gap-2 rounded-xl">
                <ListChecks className="h-4 w-4" />
                Update allergies
              </Button>
            </Link>
            <Button onClick={() => void load(true)} disabled={refreshing} className="gap-2 rounded-xl">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Run safety review
            </Button>
          </div>
        </div>
      </BentoCard>

      {error ? <BentoCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</BentoCard> : null}

      {analysis ? <SafetySetupChecklist analysis={analysis} /> : null}

      {analysis && analysis.prescriptionCount === 0 ? (
        <GuidedEmptyState
          icon={Pill}
          title="Add an active prescription first"
          body="The safety review needs at least one ongoing, short-course, or unknown-status prescription."
          primaryHref="/reports/upload?type=prescription"
          primaryLabel="Upload prescription"
          secondaryHref="/reports/medications"
          secondaryLabel="Review saved prescriptions"
        />
      ) : analysis && analysis.findings.length === 0 ? (
        <BentoCard className="border-emerald-200 bg-emerald-50/70 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-emerald-950">No obvious clash found in saved data</h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900 font-medium">
                Keep prescriptions, allergies, and recent reports updated. This review is a preparation tool, not a replacement for pharmacist-grade interaction screening.
              </p>
            </div>
          </div>
        </BentoCard>
      ) : null}

      {analysis?.findings.length ? (
        <BentoGrid className="!grid-cols-1 md:!grid-cols-2 gap-3">
          {analysis.findings.map((finding) => (
            <RiskFindingCard key={`${finding.id}-${finding.title}`} finding={finding} />
          ))}
        </BentoGrid>
      ) : null}

      {analysis?.nextSteps.length ? (
        <BentoCard className="space-y-3 p-5 bg-slate-50/50">
          <p className="font-display font-bold text-slate-900 text-lg">Next steps</p>
          {analysis.nextSteps.filter((step) => step !== analysis.disclaimer).map((step) => (
            <p key={step} className="text-sm leading-relaxed text-slate-700 font-medium">{step}</p>
          ))}
        </BentoCard>
      ) : null}

      {analysis?.disclaimer ? <p className="text-xs leading-relaxed text-slate-400 font-medium px-4">{analysis.disclaimer}</p> : null}
    </div>
  );
}

function RiskFindingCard({ finding }: { finding: PrescriptionRiskFinding }) {
  return (
    <BentoCard className={`space-y-4 border-l-4 p-5 h-full flex flex-col ${severityBorder(finding.severity)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display font-bold text-slate-900 text-lg">
            <AlertTriangle className="h-5 w-5 text-slate-400" />
            {finding.title}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{finding.source.replace("_", " ")}</p>
        </div>
        <Badge variant={severityVariant(finding.severity)} className="rounded-md px-2.5 py-1">{finding.severity}</Badge>
      </div>
      <div className="flex-1 space-y-4">
        {finding.relatedMedicines.length ? (
          <div className="flex flex-wrap gap-2">
            {finding.relatedMedicines.slice(0, 5).map((medicine) => (
              <Badge key={`${medicine.name}-${medicine.prescriptionId}`} variant="outline" className="bg-slate-50">{medicine.name}</Badge>
            ))}
          </div>
        ) : null}
        {finding.relatedMarkers.length ? (
          <div className="space-y-1">
            {finding.relatedMarkers.slice(0, 3).map((marker) => (
              <p key={`${marker.name}-${marker.reportId}`} className="text-sm text-slate-600 font-medium">
                {marker.name}: <span className="font-semibold text-slate-900">{marker.value} {marker.unit}</span> {marker.flag ? `(${marker.flag})` : ""}
              </p>
            ))}
          </div>
        ) : null}
        {finding.relatedAllergies.length ? (
          <p className="text-sm text-rose-700 font-medium">
            Allergy: {finding.relatedAllergies.map((allergy) => allergy.name).join(", ")}
          </p>
        ) : null}
      </div>
      <div className="pt-3 border-t border-slate-100">
        <p className="text-sm leading-relaxed text-slate-700">{finding.nextStep}</p>
      </div>
    </BentoCard>
  );
}

function SafetySetupChecklist({ analysis }: { analysis: PrescriptionRiskAnalysis }) {
  const items = [
    {
      label: "Active prescription saved",
      done: analysis.prescriptionCount > 0,
      action: "Upload or mark prescriptions as ongoing",
    },
    {
      label: "Medicine allergies added",
      done: analysis.allergies.length > 0,
      action: "Add allergies in Settings or Family profiles",
    },
    {
      label: "Recent reports available",
      done: analysis.reportCount > 0,
      action: "Upload lab reports for report-based safety context",
    },
  ];
  return (
    <BentoGrid className="!grid-cols-1 md:!grid-cols-3 gap-4">
      {items.map((item) => (
        <BentoCard key={item.label} className="p-4 shadow-sm bg-white border border-slate-200/60">
          <div className="flex items-start gap-3">
            {item.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />}
            <div>
              <p className="text-sm font-bold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 font-medium">{item.done ? "Ready for this review." : item.action}</p>
            </div>
          </div>
        </BentoCard>
      ))}
    </BentoGrid>
  );
}

function GuidedEmptyState({
  icon: Icon,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <BentoCard className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 border-slate-200 bg-slate-50/50">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </span>
      <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 font-medium">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={primaryHref}>
          <Button className="rounded-xl px-6">{primaryLabel}</Button>
        </Link>
        <Link href={secondaryHref}>
          <Button variant="outline" className="rounded-xl px-6 bg-white">{secondaryLabel}</Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function severityVariant(severity: RiskSeverity | PrescriptionRiskFinding["severity"]) {
  if (severity === "high") return "danger";
  if (severity === "watch") return "warning";
  if (severity === "info") return "brand";
  return "success";
}

function severityLabel(severity: RiskSeverity) {
  if (severity === "high") return "prompt review";
  if (severity === "watch") return "watch points";
  if (severity === "info") return "context only";
  return "no obvious clash";
}

function safetyHeadline(analysis: PrescriptionRiskAnalysis) {
  if (analysis.prescriptionCount === 0) return "Add prescriptions to start the safety review";
  if (analysis.severity === "high") return "Prompt clinician or pharmacist review recommended";
  if (analysis.severity === "watch") return "Review these medication watch points";
  if (analysis.findings.length) return "Helpful context found for your next review";
  return "No obvious clash found from saved data";
}

function safetySummaryText(analysis: PrescriptionRiskAnalysis) {
  if (analysis.prescriptionCount === 0) {
    return "Add at least one active prescription, then the review can check medicines against allergies and report markers.";
  }
  return analysis.summary;
}

function severityBorder(severity: PrescriptionRiskFinding["severity"]) {
  if (severity === "high") return "border-l-red-500";
  if (severity === "watch") return "border-l-amber-500";
  return "border-l-brand-500";
}

function PrescriptionList({ prescriptions }: { prescriptions: PrescriptionRecord[] }) {
  if (!prescriptions.length) {
    return (
      <BentoCard className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 border-slate-200 bg-slate-50/50">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
          <Pill className="h-8 w-8 text-slate-300" />
        </span>
        <h2 className="font-display text-xl font-bold text-slate-900">No prescriptions yet</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm font-medium">Upload a prescription to save extracted medicines and status.</p>
        <Link href="/reports/upload?type=prescription" className="mt-6 inline-flex">
          <Button className="rounded-xl px-6">Add prescription</Button>
        </Link>
      </BentoCard>
    );
  }

  return (
    <BentoGrid className="!grid-cols-1 md:!grid-cols-2 gap-4">
      {prescriptions.map((record) => (
        <BentoCard key={record.id} className="p-5 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-slate-900 text-lg truncate max-w-[70%]">{record.report.labName || "Prescription"}</h2>
              <Badge variant={record.status === "ongoing" ? "success" : record.status === "unknown" ? "warning" : "default"} className="rounded-md px-2.5 py-1">
                {record.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Medicines</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {(record.medications ?? []).map((medication) => medication.name).filter(Boolean).slice(0, 4).join(", ") || "No medicines extracted"}
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {record.linkedReports.length} linked report{record.linkedReports.length === 1 ? "" : "s"}
            </p>
            <Link href={`/reports/medications/setup?prescriptionReportId=${record.reportId}&prescriptionId=${record.id}`}>
              <Button variant="outline" size="sm" className="gap-2 rounded-lg bg-white shadow-sm border-slate-200">
                <Settings2 className="h-4 w-4" />
                Manage
              </Button>
            </Link>
          </div>
        </BentoCard>
      ))}
    </BentoGrid>
  );
}

function RefillList({ prompts }: { prompts: RefillPrompt[] }) {
  if (!prompts.length) {
    return <EmptyState icon={CalendarClock} title="No refill prompts yet" body="Saved prescriptions will appear here when timing reminders are available." />;
  }

  return (
    <BentoGrid className="!grid-cols-1 md:!grid-cols-2 gap-4">
      {prompts.map((prompt) => (
        <BentoCard key={`${prompt.reportId}-${prompt.daysSinceUpload}`} className="p-5 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-display font-bold text-slate-900 text-lg leading-tight">{prompt.medications.slice(0, 3).join(", ") || "Prescription"}</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{prompt.message}</p>
            </div>
            <Badge variant={prompt.risk === "high" ? "danger" : prompt.risk === "watch" ? "warning" : "success"} className="rounded-md px-2.5 py-1 whitespace-nowrap">{prompt.risk}</Badge>
          </div>
        </BentoCard>
      ))}
    </BentoGrid>
  );
}

function GenericOptionsPanel({ prescriptions }: { prescriptions: PrescriptionRecord[] }) {
  const options = buildGenericOptions(prescriptions);
  const medicineCount = prescriptions.reduce((count, record) => count + (record.medications ?? []).filter((medication) => medication.name).length, 0);

  if (!prescriptions.length || medicineCount === 0) {
    return (
      <GuidedEmptyState
        icon={FileText}
        title="Upload a prescription first"
        body="Generic review needs extracted medicine names from an uploaded prescription."
        primaryHref="/reports/upload?type=prescription"
        primaryLabel="Upload prescription"
        secondaryHref="/reports/medications"
        secondaryLabel="Review prescriptions"
      />
    );
  }

  return (
    <div className="space-y-5">
      <BentoCard className="p-6 bg-slate-50/50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Generic Options Review</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">Check brand-to-generic discussion points</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 font-medium">
              This local review identifies common generic molecules from saved prescriptions and prepares safe questions for your pharmacist or clinician.
              It does not compare prices or approve substitutions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="brand" className="rounded-md px-2.5 py-1">{options.filter((option) => option.confidence === "matched").length} matched</Badge>
              <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{options.filter((option) => option.confidence === "review").length} need review</Badge>
              <Badge variant="outline" className="bg-white rounded-md px-2.5 py-1">{medicineCount} medicine(s)</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link href="/reports/medications?tab=risks">
              <Button variant="outline" className="gap-2 rounded-xl bg-white">
                Safety review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/reports/upload?type=prescription">
              <Button className="gap-2 rounded-xl">
                <Pill className="h-4 w-4" />
                Add prescription
              </Button>
            </Link>
          </div>
        </div>
      </BentoCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {options.map((option) => (
          <BentoCard key={`${option.sourcePrescription.id}-${option.originalName}-${option.genericName}`} className="p-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saved medicine</p>
                  <h3 className="mt-1 font-display font-bold text-slate-900 text-lg">{option.originalName}</h3>
                </div>
                <Badge variant={option.confidence === "matched" ? "success" : "warning"} className="rounded-md px-2.5 py-1 whitespace-nowrap">
                  {option.confidence === "matched" ? "matched" : "pharmacist review"}
                </Badge>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Generic molecule</p>
                <p className="mt-1 font-semibold text-slate-900 text-base">{option.genericName}</p>
                <p className="mt-1 text-sm text-slate-600 font-medium">{option.className}</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 font-medium">{option.note}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{option.sourcePrescription.report.labName || "Prescription"}</span>
              <span className="text-slate-300">•</span>
              <span>{option.sourcePrescription.status.replace("_", " ")}</span>
            </div>
          </BentoCard>
        ))}
      </div>

      <BentoCard className="border-amber-200 bg-amber-50/70 p-5 shadow-none">
        <p className="font-display font-bold text-amber-950 text-lg">Substitution safety note</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900 font-medium">
          Do not start, stop, switch, or change medicines based on this review. Brand and generic decisions depend on molecule, dose,
          release form, route, combination ingredients, allergies, reports, and prescriber instructions.
        </p>
      </BentoCard>
    </div>
  );
}

function buildGenericOptions(prescriptions: PrescriptionRecord[]): GenericOption[] {
  const seen = new Set<string>();
  const options: GenericOption[] = [];

  prescriptions.forEach((record) => {
    (record.medications ?? []).forEach((medication) => {
      const originalName = medication.name?.trim();
      if (!originalName) return;
      const normalized = normalizeMedicineName(originalName);
      const key = `${record.id}-${normalized}`;
      if (seen.has(key)) return;
      seen.add(key);
      const match = GENERIC_GUIDE.find((entry) => entry.aliases.some((alias) => normalized.includes(normalizeMedicineName(alias))));
      options.push({
        originalName,
        genericName: match?.genericName ?? "Needs pharmacist confirmation",
        className: match?.className ?? "Medicine name could not be confidently mapped locally",
        confidence: match ? "matched" : "review",
        note:
          match?.note ??
          "Ask the pharmacist to confirm the generic molecule, strength, release form, route, and whether the prescription says brand-only.",
        sourcePrescription: record,
      });
    });
  });

  return options.sort((a, b) => (a.confidence === b.confidence ? a.originalName.localeCompare(b.originalName) : a.confidence === "review" ? -1 : 1));
}

function normalizeMedicineName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|units?)\b/g, " ")
    .replace(/\b(tablet|tab|capsule|cap|syrup|injection|inj|cream|ointment|drops|sr|xr|er|dr|od|bd|tds)\b/g, " ")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <BentoCard className="p-8 text-center flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 border-slate-200 bg-slate-50/50">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </span>
      <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">{body}</p>
    </BentoCard>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
