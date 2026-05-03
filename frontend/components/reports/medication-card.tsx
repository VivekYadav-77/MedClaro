import { Pill } from "lucide-react";

import { Card } from "@/components/ui/card";
import { MedicationCard as MedicationCardType } from "@/lib/types";

export function MedicationCard({ medication }: { medication: MedicationCardType }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-sea">
          <Pill className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-ink">{medication.name}</h3>
          <p className="text-sm text-[#6b8292]">
            {medication.dosage} • {medication.frequency}
          </p>
        </div>
      </div>
      <div className="grid gap-3 text-sm text-[#355166] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-ink">Purpose</p>
          <p>{medication.purpose}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Duration</p>
          <p>{medication.duration}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Common side effects</p>
          <p>{medication.sideEffects.join(", ")}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Worth avoiding</p>
          <p>{medication.avoid.join(", ")}</p>
        </div>
      </div>
      <div className="rounded-3xl bg-mist p-4 text-sm text-[#355166]">{medication.interactionNotes}</div>
    </Card>
  );
}
