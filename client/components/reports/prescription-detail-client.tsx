"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Loader2, Pill, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrescriptionAnalysis, PrescriptionRecord } from "@/lib/types";

export function PrescriptionDetailClient({ prescriptionId }: { prescriptionId: string }) {
  const { data: session } = useSession();
  const [prescription, setPrescription] = useState<PrescriptionRecord | null>(null);
  const [analyses, setAnalyses] = useState<PrescriptionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [prescriptionResponse, analysesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions`, { headers, cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/prescriptions/${prescriptionId}/analyses`, { headers, cache: "no-store" }),
      ]);
      const prescriptionPayload = await prescriptionResponse.json().catch(() => null);
      const analysesPayload = await analysesResponse.json().catch(() => null);
      const records = prescriptionResponse.ok ? prescriptionPayload.prescriptions ?? [] : [];
      setPrescription(records.find((record: PrescriptionRecord) => record.id === prescriptionId) ?? null);
      setAnalyses(analysesResponse.ok ? analysesPayload.analyses ?? [] : []);
      setLoading(false);
    }

    void load();
  }, [prescriptionId, session?.accessToken]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/reports/medications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to medication center
      </Link>

      {loading ? (
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading prescription
        </Card>
      ) : null}

      {!loading && !prescription ? (
        <Card className="p-6 text-sm text-slate-600">Prescription not found.</Card>
      ) : null}

      {prescription ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Prescription review</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">{prescription.report.labName || "Saved prescription"}</h1>
              <p className="mt-2 text-sm text-slate-600">{prescription.medications.length} extracted medicine(s), {prescription.linkedReports.length} linked report(s)</p>
            </div>
            <Link href={`/reports/medications/intake?prescriptionId=${prescription.id}`}>
              <Button className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Run guided analysis
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              <Card className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                  <Pill className="h-4 w-4 text-brand-600" />
                  Medicines
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {prescription.medications.map((medication) => (
                    <div key={`${medication.name}-${medication.dosage}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{medication.name || "Medicine"}</p>
                      <p className="text-sm text-slate-500">{medication.dosage || "Dose not extracted"} {medication.frequency || ""}</p>
                      <p className="mt-1 text-xs text-slate-500">{medication.purpose || "Purpose not extracted"}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-3 p-5">
                <h2 className="font-semibold text-slate-950">Saved analysis history</h2>
                {analyses.length ? (
                  analyses.map((analysis) => (
                    <div key={analysis.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-6 text-slate-700">{analysis.summary || "Focused medication review saved."}</p>
                        {analysis.riskLevel ? <Badge variant={analysis.riskLevel === "high" ? "danger" : analysis.riskLevel === "moderate" ? "warning" : "success"}>{analysis.riskLevel}</Badge> : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{String(analysis.createdAt).slice(0, 10)} - {analysis.relatedReportIds.length} report(s), {analysis.comparisonPrescriptionIds.length} comparison prescription(s)</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No saved analysis yet. Run guided analysis to create one.</p>
                )}
              </Card>
            </section>

            <aside className="space-y-4">
              <Card className="p-4">
                <p className="text-sm font-semibold text-slate-900">Status</p>
                <Badge className="mt-2" variant={prescription.status === "ongoing" ? "success" : prescription.status === "unknown" ? "warning" : "default"}>{prescription.status.replace("_", " ")}</Badge>
              </Card>
              <Card className="space-y-3 p-4">
                <p className="text-sm font-semibold text-slate-900">Linked reports</p>
                {prescription.linkedReports.length ? (
                  prescription.linkedReports.map((report) => (
                    <Link key={report._id} href={`/reports/${report._id}`} className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800">
                      <FileText className="h-4 w-4" />
                      {report.labName || report.reportType}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No report context linked.</p>
                )}
              </Card>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
