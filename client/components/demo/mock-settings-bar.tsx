"use client";

import { Moon, SunMedium } from "lucide-react";

import type { DemoLanguage, DemoProfile } from "@/components/demo/demo-container";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  highContrast: boolean;
  language: DemoLanguage;
  profile: DemoProfile;
  onHighContrastChange: (value: boolean) => void;
  onLanguageChange: (value: DemoLanguage) => void;
  onProfileChange: (value: DemoProfile) => void;
};

export function MockSettingsBar({
  highContrast,
  language,
  profile,
  onHighContrastChange,
  onLanguageChange,
  onProfileChange
}: Props) {
  return (
    <div className={cn("grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]", highContrast && "border-white/20")}>
      <label className="text-xs font-semibold uppercase text-slate-500">
        Family profile
        <Select
          className="mt-2 rounded-lg"
          value={profile}
          onChange={(event) => onProfileChange(event.target.value as DemoProfile)}
        >
          <option>Self</option>
          <option>Mom</option>
          <option>Dad</option>
        </Select>
      </label>
      <label className="text-xs font-semibold uppercase text-slate-500">
        Language
        <Select
          className="mt-2 rounded-lg"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as DemoLanguage)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
        </Select>
      </label>
      <button
        type="button"
        onClick={() => onHighContrastChange(!highContrast)}
        className={cn(
          "mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold",
          highContrast && "border-white bg-white text-slate-950"
        )}
        title="Toggle high contrast mode"
      >
        {highContrast ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        Contrast
      </button>
    </div>
  );
}
