import { MedicationsClient } from "@/components/reports/medications-client";

export default function PrescriptionAnalysisPage() {
  return (
    <MedicationsClient
      eyebrow="Prescription Analysis"
      title="Prescriptions analysis"
      description="Review saved prescriptions, medicine extraction, refill prompts, and report-linked prescription context from one dedicated page."
      basePath="/prescriptions/analysis"
    />
  );
}
