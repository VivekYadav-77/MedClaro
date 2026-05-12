"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FileText, Loader2, Pill, RefreshCw, Upload } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MedicationConflictPanel } from "@/components/reports/medication-conflict-panel";
import { Report } from "@/lib/types";

type MedicationContext = {
  prescription: Report;
  relatedReports: Report[];
  message: string;
};

type RefillPrompt = {
  reportId: string;
  medications: string[];
  daysSinceUpload: number;
  risk: "normal" | "watch" | "high";
  message: string;
};

export function MedicationsClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [contexts, setContexts] = useState<MedicationContext[]>([]);
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
      const [contextResponse, adherenceResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/medication-context`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/adherence`, { headers, cache: "no-store" }),
      ]);
      const contextPayload = await contextResponse.json().catch(() => null);
      const adherencePayload = await adherenceResponse.json().catch(() => null);
      setContexts(contextResponse.ok ? contextPayload.contexts ?? [] : []);
      setRefills(adherenceResponse.ok ? adherencePayload.prompts ?? [] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [session?.accessToken]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Medication Center</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Medication risk, refills, and generic options</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload prescriptions, connect them with nearby blood reports, and prepare safer questions for your clinician.
          </p>
        </div>
        <Link href="/reports/upload?type=prescription&next=medication-risk">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload prescription
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabLink href="/reports/medications" label="Overview" active={activeTab === "overview"} />
        <TabLink href="/reports/medications?tab=refills" label="Refills" active={activeTab === "refills"} />
        <TabLink href="/reports/medications?tab=generics" label="Generics" active={activeTab === "generics"} />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading medication context
        </Card>
      ) : null}

      {activeTab === "refills" ? <RefillPanel prompts={refills} /> : activeTab === "generics" ? <GenericPanel contexts={contexts} /> : <OverviewPanel contexts={contexts} />}
    </div>
  );
}

function OverviewPanel({ contexts }: { contexts: MedicationContext[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        {contexts.length ? (
          contexts.map((context) => (
            <Card key={context.prescription._id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Pill className="h-4 w-4 text-brand-600" />
                    {context.prescription.labName || "Prescription"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{context.message}</p>
                </div>
                <Badge>{context.prescription.medications?.length ?? 0} meds</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(context.prescription.medications ?? []).slice(0, 4).map((medication) => (
                  <div key={medication.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{medication.name}</p>
                    <p className="text-sm text-slate-500">{medication.dosage || "Dose not extracted"} {medication.frequency || ""}</p>
                  </div>
                ))}
              </div>
              {context.relatedReports.length ? (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">Related analyzed reports</p>
                  <div className="mt-2 space-y-2">
                    {context.relatedReports.map((report) => (
                      <Link key={report._id} href={`/reports/${report._id}`} className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800">
                        <FileText className="h-4 w-4" />
                        {report.labName || report.reportType}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyMedicationState />
        )}
      </section>
      <MedicationConflictPanel />
    </div>
  );
}

function RefillPanel({ prompts }: { prompts: RefillPrompt[] }) {
  if (!prompts.length) return <EmptyMedicationState />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {prompts.map((prompt) => (
        <Card key={prompt.reportId} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-slate-900">{prompt.medications.slice(0, 2).join(", ") || "Prescription refill"}</p>
            <Badge variant={prompt.risk === "high" ? "danger" : prompt.risk === "watch" ? "warning" : "success"}>{prompt.risk}</Badge>
          </div>
          <p className="text-sm leading-6 text-slate-600">{prompt.message}</p>
          <Link href={`/reports/${prompt.reportId}?tab=meds`}>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Open prescription
            </Button>
          </Link>
        </Card>
      ))}
    </div>
  );
}

function GenericPanel({ contexts }: { contexts: MedicationContext[] }) {
  const meds = contexts.flatMap((context) => context.prescription.medications ?? []);
  return (
    <Card className="space-y-4 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 text-amber-700" />
        <div>
          <h2 className="font-semibold text-amber-950">Generic finder needs a trusted medicine database</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Detected {meds.length} prescription medicine(s). The app can show active molecules from parsed prescriptions, but price/brand substitution should stay pending until a reliable local database is connected.
          </p>
        </div>
      </div>
      {meds.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {meds.slice(0, 8).map((medication) => (
            <div key={`${medication.name}-${medication.dosage}`} className="rounded-lg bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{medication.name}</p>
              <p className="text-slate-500">{medication.purpose || "Purpose not extracted"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function EmptyMedicationState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Pill className="mx-auto h-9 w-9 text-slate-300" />
      <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">No prescriptions yet</h2>
      <p className="mt-1 text-sm text-slate-500">Upload a prescription to unlock medication risk, refill timing, and generic review.</p>
      <Link href="/reports/upload?type=prescription&next=medication-risk">
        <Button className="mt-5 gap-2">
          <Upload className="h-4 w-4" />
          Upload prescription
        </Button>
      </Link>
    </div>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
        active ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
