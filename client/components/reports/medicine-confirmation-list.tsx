"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ExtractedMedicine } from "./prescription-upload-modal";

type Props = {
  initialMedicines: ExtractedMedicine[];
  /** Called when the user locks in the final list */
  onConfirm: (medicines: ExtractedMedicine[]) => void;
  onBack: () => void;
};

const EMPTY_MED: ExtractedMedicine = {
  medicine_name: "",
  dosage: null,
  frequency: null,
  duration: null,
  route: null,
};

export function MedicineConfirmationList({ initialMedicines, onConfirm, onBack }: Props) {
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>(
    initialMedicines.length > 0 ? initialMedicines : [{ ...EMPTY_MED }],
  );

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function updateField(index: number, field: keyof ExtractedMedicine, value: string) {
    setMedicines((current) =>
      current.map((med, i) => (i === index ? { ...med, [field]: value || null } : med)),
    );
  }

  function removeMedicine(index: number) {
    setMedicines((current) => current.filter((_, i) => i !== index));
  }

  function addMedicine() {
    setMedicines((current) => [...current, { ...EMPTY_MED }]);
  }

  const canConfirm = medicines.some((m) => m.medicine_name.trim().length > 0);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Step 2 of 3</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Verify extracted medicines</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          The AI extracted these medicines from your prescription. Correct any mistakes before proceeding — accurate
          medicine names are critical for a safe risk analysis.
        </p>
      </div>

      {/* Safety notice */}
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900">
          <strong>Important:</strong> OCR and AI extraction can make mistakes, especially with handwritten
          prescriptions. Always verify the medicine names against the original document.
        </p>
      </Card>

      {/* Medicine list */}
      <div className="space-y-3">
        {medicines.map((med, index) => (
          <Card key={index} className="p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Medicine name <span className="text-rose-500">*</span>
                </label>
                <Input
                  id={`medicine-name-${index}`}
                  value={med.medicine_name}
                  onChange={(e) => updateField(index, "medicine_name", e.target.value)}
                  placeholder="e.g. Augmentin, Metformin"
                  className={med.medicine_name.trim() === "" ? "border-rose-300 focus:ring-rose-200" : ""}
                />
              </div>
              {/* Dosage */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Dosage</label>
                <Input
                  id={`medicine-dosage-${index}`}
                  value={med.dosage ?? ""}
                  onChange={(e) => updateField(index, "dosage", e.target.value)}
                  placeholder="e.g. 500mg"
                />
              </div>
              {/* Frequency */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Frequency</label>
                <Input
                  id={`medicine-freq-${index}`}
                  value={med.frequency ?? ""}
                  onChange={(e) => updateField(index, "frequency", e.target.value)}
                  placeholder="e.g. 1-0-1, BD"
                />
              </div>
              {/* Remove */}
              <div className="flex items-end">
                <button
                  type="button"
                  id={`btn-remove-medicine-${index}`}
                  onClick={() => removeMedicine(index)}
                  disabled={medicines.length === 1}
                  className="mb-0.5 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Remove medicine"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Duration row */}
            <div className="mt-3 space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Duration</label>
              <Input
                id={`medicine-duration-${index}`}
                value={med.duration ?? ""}
                onChange={(e) => updateField(index, "duration", e.target.value)}
                placeholder="e.g. 5 days, ongoing"
                className="max-w-xs"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Add medicine row */}
      <button
        type="button"
        id="btn-add-medicine"
        onClick={addMedicine}
        className="flex items-center gap-2 rounded-lg border border-dashed border-brand-300 px-4 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
      >
        <Plus className="h-4 w-4" />
        Add medicine manually
      </button>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button
          onClick={() => onConfirm(medicines.filter((m) => m.medicine_name.trim().length > 0))}
          disabled={!canConfirm}
          className="gap-2"
          id="btn-confirm-medicines"
        >
          Confirm & run risk check
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onBack} id="btn-back-to-upload">
          Back
        </Button>
      </div>
    </div>
  );
}
