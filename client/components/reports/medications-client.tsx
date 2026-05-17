"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, FileText, Loader2, Pill, RefreshCw, Settings2, type LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrescriptionRecord } from "@/lib/types";

type RefillPrompt = {
  reportId: string;
  medications: string[];
  daysSinceUpload: number;
  risk: "normal" | "watch" | "high";
  message: string;
};

export function MedicationsClient({
  eyebrow = "Medication Center",
  title = "Prescription tracking",
  description = "Keep prescriptions organized, mark whether they are ongoing or completed, and connect supporting reports for future review.",
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Link href="/reports/upload?type=prescription">
          <Button className="gap-2">
            <Pill className="h-4 w-4" />
            Add prescription
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabLink href={basePath} label="Overview" active={activeTab === "overview"} />
        <TabLink href={`${basePath}?tab=refills`} label="Refills" active={activeTab === "refills"} />
        <TabLink href={`${basePath}?tab=generics`} label="Generics" active={activeTab === "generics"} />
        <Button variant="ghost" size="sm" onClick={() => void load()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading prescriptions
        </Card>
      ) : activeTab === "refills" ? (
        <RefillList prompts={refills} />
      ) : activeTab === "generics" ? (
        <GenericsPlaceholder hasPrescriptions={prescriptions.length > 0} />
      ) : (
        <PrescriptionList prescriptions={prescriptions} />
      )}
    </div>
  );
}

function PrescriptionList({ prescriptions }: { prescriptions: PrescriptionRecord[] }) {
  if (!prescriptions.length) {
    return (
      <Card className="p-6 text-center">
        <Pill className="mx-auto h-8 w-8 text-slate-400" />
        <h2 className="mt-3 font-semibold text-slate-950">No prescriptions yet</h2>
        <p className="mt-1 text-sm text-slate-500">Upload a prescription to save extracted medicines and status.</p>
        <Link href="/reports/upload?type=prescription" className="mt-4 inline-flex">
          <Button>Add prescription</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {prescriptions.map((record) => (
        <Card key={record.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950">{record.report.labName || "Prescription"}</h2>
                <Badge variant={record.status === "ongoing" ? "success" : record.status === "unknown" ? "warning" : "default"}>
                  {record.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {(record.medications ?? []).map((medication) => medication.name).filter(Boolean).slice(0, 4).join(", ") || "No medicines extracted"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {record.linkedReports.length} linked report{record.linkedReports.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link href={`/reports/medications/setup?prescriptionReportId=${record.reportId}&prescriptionId=${record.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Manage
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RefillList({ prompts }: { prompts: RefillPrompt[] }) {
  if (!prompts.length) {
    return <EmptyState icon={CalendarClock} title="No refill prompts yet" body="Saved prescriptions will appear here when timing reminders are available." />;
  }

  return (
    <div className="grid gap-3">
      {prompts.map((prompt) => (
        <Card key={`${prompt.reportId}-${prompt.daysSinceUpload}`} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-950">{prompt.medications.slice(0, 3).join(", ") || "Prescription"}</p>
              <p className="mt-1 text-sm text-slate-600">{prompt.message}</p>
            </div>
            <Badge variant={prompt.risk === "high" ? "danger" : prompt.risk === "watch" ? "warning" : "success"}>{prompt.risk}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GenericsPlaceholder({ hasPrescriptions }: { hasPrescriptions: boolean }) {
  return (
    <EmptyState
      icon={FileText}
      title={hasPrescriptions ? "Generic options are not configured yet" : "Upload a prescription first"}
      body={
        hasPrescriptions
          ? "The saved prescription list is ready for the generic finder when that module is connected."
          : "Generic alternatives need extracted prescription medicines before they can be reviewed."
      }
    />
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <Card className="p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-400" />
      <h2 className="mt-3 font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </Card>
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
