import { PrescriptionDetailClient } from "@/components/reports/prescription-detail-client";

export default function PrescriptionDetailPage({ params }: { params: { prescriptionId: string } }) {
  return <PrescriptionDetailClient prescriptionId={params.prescriptionId} />;
}
