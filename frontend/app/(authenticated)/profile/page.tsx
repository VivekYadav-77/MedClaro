"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Languages,
  LifeBuoy,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound
} from "lucide-react";
import {
  FormField,
  PageHeader,
  PermissionNotice,
  SafetyNotice,
  SectionHeader,
  StatusBadge
} from "@/components/design-system";
import { LoadingState, UnauthorizedState } from "@/components/app-states";
import { ApiError, profilesApi } from "@/lib/api";
import { useSession } from "@/lib/session";

type Allergy = {
  name: string;
  reaction: string;
  severity: string;
  notes: string;
};

type KnownCondition = {
  name: string;
  diagnosed_year: string;
  status: string;
  notes: string;
};

type FamilyHistoryItem = {
  relation: string;
  condition: string;
  notes: string;
};

type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
  email: string;
  is_primary: boolean;
};

type ProfilePayload = {
  id?: number;
  age: number | "";
  gender: string;
  height_cm: string;
  weight_kg: string;
  blood_group: string;
  occupation: string;
  smoking: string;
  alcohol: string;
  exercise: string;
  sleep_hours: string;
  pregnancy_status: string;
  preferred_language: string;
  food_preference: string;
  location: string;
  privacy_consent: boolean;
  allergies: Allergy[];
  known_conditions: KnownCondition[];
  family_history: FamilyHistoryItem[];
  emergency_contacts: EmergencyContact[];
};

type ProfileResponse = Omit<ProfilePayload, "known_conditions"> & {
  completion_percentage?: number;
  known_conditions: Array<Omit<KnownCondition, "diagnosed_year"> & { diagnosed_year: number | null }>;
};

type StepKey =
  | "intro"
  | "basic"
  | "lifestyle"
  | "medical"
  | "emergency"
  | "preferences"
  | "consent"
  | "handoff";

const steps: Array<{ key: StepKey; label: string; title: string; context: string }> = [
  {
    key: "intro",
    label: "Start",
    title: "Safety and privacy",
    context:
      "This helps MedClaro personalize explanations while keeping the product clear that it does not diagnose."
  },
  {
    key: "basic",
    label: "Basics",
    title: "Basic details",
    context:
      "Age, body measurements, and blood group help put reports and medicines in a safer personal context."
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    title: "Lifestyle and daily context",
    context:
      "Lifestyle details help MedClaro explain trends and prepare practical doctor discussion prompts."
  },
  {
    key: "medical",
    label: "Medical",
    title: "Medical context",
    context:
      "Allergies, existing conditions, and family history are important safety context for reports and medicines."
  },
  {
    key: "emergency",
    label: "Emergency",
    title: "Emergency contacts",
    context:
      "Emergency contacts support future family care and time-limited emergency profile sharing."
  },
  {
    key: "preferences",
    label: "Preferences",
    title: "Language and accessibility",
    context:
      "Language and readability preferences help MedClaro keep explanations understandable."
  },
  {
    key: "consent",
    label: "Consent",
    title: "Consent and review",
    context:
      "Consent is required before this profile is used as health context for AI explanations."
  },
  {
    key: "handoff",
    label: "Hub",
    title: "Health Hub handoff",
    context:
      "Your Health Hub becomes the next command center for documents, reports, medicines, and daily health."
  }
];

const initialProfile: ProfilePayload = {
  age: "",
  gender: "",
  height_cm: "",
  weight_kg: "",
  blood_group: "",
  occupation: "",
  smoking: "prefer_not_to_say",
  alcohol: "prefer_not_to_say",
  exercise: "",
  sleep_hours: "",
  pregnancy_status: "",
  preferred_language: "English",
  food_preference: "",
  location: "",
  privacy_consent: false,
  allergies: [],
  known_conditions: [],
  family_history: [],
  emergency_contacts: []
};

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function ProfilePage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [profile, setProfile] = useState<ProfilePayload>(initialProfile);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");

  const completion = useMemo(() => calculateCompletion(profile), [profile]);
  const currentStep = steps[activeStep];

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }

    let isMounted = true;
    setStatus("loading");
    profilesApi
      .current<ProfileResponse | null>(token)
      .then((data) => {
        if (!isMounted) return;
        if (data) setProfile(mapProfileResponse(data));
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Could not load your profile. You can still review the form and try again.");
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, isSignedIn, token]);

  function update<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const validation = validateProfile(profile);
    if (validation) {
      setStatus("error");
      setMessage(validation);
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const payload = toApiPayload(profile);
      const saved = profile.id
        ? await profilesApi.update<ProfileResponse>(profile.id, payload, token)
        : await profilesApi.create<ProfileResponse>(payload, token);
      setProfile(mapProfileResponse(saved));
      setStatus("saved");
      setMessage("Profile saved. You can update this later.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const existing = await profilesApi.current<ProfileResponse | null>(token);
          if (existing) {
            const saved = await profilesApi.update<ProfileResponse>(
              existing.id ?? profile.id ?? 0,
              toApiPayload({ ...profile, id: existing.id }),
              token
            );
            setProfile(mapProfileResponse(saved));
            setStatus("saved");
            setMessage("Existing profile updated.");
            return;
          }
        } catch {
          // Fall through to the user-facing recovery message below.
        }
      }
      setStatus("error");
      let errorMessage = "Could not save your profile. Check required fields and try again.";
      if (error instanceof ApiError && error.details && typeof error.details === "object") {
        const details = error.details as Record<string, string[]>;
        const firstErrorKey = Object.keys(details)[0];
        if (firstErrorKey && Array.isArray(details[firstErrorKey]) && details[firstErrorKey].length > 0) {
          errorMessage = details[firstErrorKey][0];
        }
      }
      setMessage(errorMessage);
    }
  }

  function nextStep() {
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading profile workspace" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <button
              className="min-h-11 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white"
              type="button"
              onClick={() => router.push("/signin")}
            >
              Sign in
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-claro-background">
      <PageHeader
        eyebrow="Personal Health Profile"
        title="Build Your Health Memory"
        description="Complete the essentials in small steps. MedClaro uses this profile as private context for educational explanations, reports, medicines, and family care."
        notice={
          <SafetyNotice>
            MedClaro does not diagnose or replace a doctor. You control what you add,
            and you can update this profile later.
          </SafetyNotice>
        }
      />

      <form className="mx-auto max-w-6xl px-6 py-8 lg:px-8" onSubmit={saveProfile}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <OnboardingStepper activeStep={activeStep} onStepChange={setActiveStep} />

            <div className="mt-6 border-t border-claro-border pt-6">
              <SectionHeader
                title={currentStep.title}
                description="Required fields are kept light. Sensitive details can use 'prefer not to say' or be left blank where optional."
              />

              <div className="mt-6">
                {currentStep.key === "intro" ? <IntroStep /> : null}
                {currentStep.key === "basic" ? (
                  <BasicStep profile={profile} update={update} />
                ) : null}
                {currentStep.key === "lifestyle" ? (
                  <LifestyleStep profile={profile} update={update} />
                ) : null}
                {currentStep.key === "medical" ? (
                  <MedicalStep profile={profile} update={update} />
                ) : null}
                {currentStep.key === "emergency" ? (
                  <EmergencyStep profile={profile} update={update} />
                ) : null}
                {currentStep.key === "preferences" ? (
                  <PreferencesStep profile={profile} update={update} />
                ) : null}
                {currentStep.key === "consent" ? (
                  <ConsentStep profile={profile} update={update} completion={completion} />
                ) : null}
                {currentStep.key === "handoff" ? (
                  <HandoffStep completion={completion} onOpenHub={() => router.push("/hub")} />
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-claro-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {message ? (
                  <p
                    className={`flex items-center gap-2 text-sm font-medium ${
                      status === "error" ? "text-claro-rose" : "text-claro-mint"
                    }`}
                  >
                    {status === "error" ? (
                      <AlertCircle className="h-4 w-4" aria-hidden />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    )}
                    {message}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Progress saves to your MedClaro session.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                  type="button"
                  onClick={previousStep}
                  disabled={activeStep === 0}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                  type="submit"
                  disabled={status === "saving"}
                >
                  {status === "saving" ? "Saving..." : "Save progress"}
                </button>
                {activeStep < steps.length - 1 ? (
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white"
                    type="button"
                    onClick={nextStep}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white"
                    type="button"
                    onClick={() => router.push("/hub")}
                  >
                    Open Health Hub
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <ProfileCompletionCard completion={completion} profile={profile} />
            <ContextPanel step={currentStep} />
            <SeniorModePrompt />
          </aside>
        </div>
      </form>
    </main>
  );
}

function OnboardingStepper({
  activeStep,
  onStepChange
}: {
  activeStep: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <nav aria-label="Profile onboarding steps">
      <ol className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          return (
            <li key={step.key}>
              <button
                className={`flex min-h-12 w-full items-center gap-2 rounded-md border px-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-claro-blue bg-blue-50 text-claro-blue"
                    : isDone
                      ? "border-emerald-200 bg-emerald-50 text-claro-mint"
                      : "border-claro-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
                onClick={() => onStepChange(index)}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs">
                  {index + 1}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ProfileCompletionCard({
  completion,
  profile
}: {
  completion: number;
  profile: ProfilePayload;
}) {
  const contextCount =
    profile.allergies.length +
    profile.known_conditions.length +
    profile.family_history.length +
    profile.emergency_contacts.length;

  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-claro-blue" aria-hidden />
        <h2 className="text-lg font-semibold text-claro-ink">Profile completion</h2>
      </div>
      <div className="mt-4 h-3 rounded-full bg-slate-200">
        <div className="h-3 rounded-full bg-claro-mint" style={{ width: `${completion}%` }} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-semibold text-claro-ink">{completion}%</p>
        <StatusBadge tone={profile.privacy_consent ? "success" : "attention"}>
          {profile.privacy_consent ? "Consent ready" : "Consent needed"}
        </StatusBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {contextCount} medical context item{contextCount === 1 ? "" : "s"} added.
      </p>
    </section>
  );
}

function ContextPanel({ step }: { step: (typeof steps)[number] }) {
  return (
    <PermissionNotice title="Why this step matters">
      {step.context} Only people you authorize can access shared health information.
    </PermissionNotice>
  );
}

function SeniorModePrompt() {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-5 w-5 text-claro-mint" aria-hidden />
        <h2 className="text-lg font-semibold text-claro-ink">Senior-friendly setup</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Use one step at a time, larger touch targets, and simple privacy language.
        Voice/read-aloud controls will connect in the accessibility phase.
      </p>
    </section>
  );
}

function IntroStep() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SafetyNotice title="Educational support">
        MedClaro explains documents and prepares questions. It does not diagnose,
        prescribe, or replace qualified medical care.
      </SafetyNotice>
      <PermissionNotice title="Private by default">
        Your profile stays owner-scoped. Family, doctor, and emergency sharing must
        be explicitly authorized later.
      </PermissionNotice>
    </div>
  );
}

function BasicStep({
  profile,
  update
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Age" hint="Optional, range 0 to 130.">
        <input
          className={fieldClass}
          max={130}
          min={0}
          type="number"
          value={profile.age}
          onChange={(event) => update("age", event.target.value === "" ? "" : Number(event.target.value))}
        />
      </FormField>
      <FormField label="Gender">
        <select className={fieldClass} value={profile.gender} onChange={(event) => update("gender", event.target.value)}>
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="non_binary">Non-binary</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </FormField>
      <FormField label="Height cm" hint="Optional, range 30 to 260 cm.">
        <input className={fieldClass} type="number" value={profile.height_cm} onChange={(event) => update("height_cm", event.target.value)} />
      </FormField>
      <FormField label="Weight kg" hint="Optional, range 1 to 350 kg.">
        <input className={fieldClass} type="number" value={profile.weight_kg} onChange={(event) => update("weight_kg", event.target.value)} />
      </FormField>
      <FormField label="Blood group">
        <select className={fieldClass} value={profile.blood_group} onChange={(event) => update("blood_group", event.target.value)}>
          <option value="">Select</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"].map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Occupation">
        <input className={fieldClass} value={profile.occupation} onChange={(event) => update("occupation", event.target.value)} />
      </FormField>
    </div>
  );
}

function LifestyleStep({
  profile,
  update
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Smoking">
        <FrequencySelect value={profile.smoking} onChange={(value) => update("smoking", value)} />
      </FormField>
      <FormField label="Alcohol">
        <FrequencySelect value={profile.alcohol} onChange={(value) => update("alcohol", value)} />
      </FormField>
      <FormField label="Exercise">
        <input className={fieldClass} placeholder="Walks 30 minutes, yoga, gym..." value={profile.exercise} onChange={(event) => update("exercise", event.target.value)} />
      </FormField>
      <FormField label="Sleep hours">
        <input className={fieldClass} max={24} min={0} type="number" value={profile.sleep_hours} onChange={(event) => update("sleep_hours", event.target.value)} />
      </FormField>
      {profile.gender !== "male" && (
        <FormField label="Pregnancy status" hint="Optional. Leave blank if not clinically relevant.">
          <input className={fieldClass} value={profile.pregnancy_status} onChange={(event) => update("pregnancy_status", event.target.value)} />
        </FormField>
      )}
      <FormField label="Location">
        <input className={fieldClass} value={profile.location} onChange={(event) => update("location", event.target.value)} />
      </FormField>
    </div>
  );
}

function FrequencySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="never">Never</option>
      <option value="former">Former</option>
      <option value="occasional">Occasional</option>
      <option value="regular">Regular</option>
      <option value="prefer_not_to_say">Prefer not to say</option>
    </select>
  );
}

function MedicalStep({
  profile,
  update
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <AllergyEditor items={profile.allergies} onChange={(items) => update("allergies", items)} />
      <ConditionEditor items={profile.known_conditions} onChange={(items) => update("known_conditions", items)} />
      <FamilyHistoryEditor items={profile.family_history} onChange={(items) => update("family_history", items)} />
    </div>
  );
}

function EmergencyStep({
  profile,
  update
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
}) {
  return (
    <ContactEditor
      items={profile.emergency_contacts}
      onChange={(items) => update("emergency_contacts", items)}
    />
  );
}

function PreferencesStep({
  profile,
  update
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Preferred language">
        <div className="relative">
          <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input className={`${fieldClass} pl-9`} value={profile.preferred_language} onChange={(event) => update("preferred_language", event.target.value)} />
        </div>
      </FormField>
      <FormField label="Food preference">
        <select className={fieldClass} value={profile.food_preference} onChange={(event) => update("food_preference", event.target.value)}>
          <option value="">Select</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="non_vegetarian">Non-vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="eggetarian">Eggetarian</option>
          <option value="other">Other</option>
        </select>
      </FormField>
    </div>
  );
}

function ConsentStep({
  profile,
  update,
  completion
}: {
  profile: ProfilePayload;
  update: <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => void;
  completion: number;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-claro-border bg-claro-muted p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-claro-mint" aria-hidden />
          <h3 className="font-semibold text-claro-ink">Consent and privacy summary</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This profile helps MedClaro personalize educational explanations. It is not
          a diagnosis, and shared access is controlled separately through explicit permissions.
        </p>
      </section>
      <label className="flex min-h-14 items-start gap-3 rounded-md border border-claro-border bg-white p-4 text-sm text-slate-700">
        <input
          className="mt-1 h-5 w-5 rounded border-slate-300"
          checked={profile.privacy_consent}
          type="checkbox"
          onChange={(event) => update("privacy_consent", event.target.checked)}
        />
        <span>
          <span className="font-semibold text-claro-ink">
            I consent to storing my Personal Health Profile.
          </span>
          <span className="mt-1 block leading-6">
            MedClaro can use it as private context for educational health intelligence features.
          </span>
        </span>
      </label>
      <p className="text-sm font-medium text-slate-600">Current completion: {completion}%</p>
    </div>
  );
}

function HandoffStep({
  completion,
  onOpenHub
}: {
  completion: number;
  onOpenHub: () => void;
}) {
  return (
    <div className="rounded-md border border-claro-border bg-white p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-claro-mint" aria-hidden />
        <h3 className="text-xl font-semibold text-claro-ink">Ready for your Health Hub</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Your profile is {completion}% complete. Next, upload a document, review
        medicines, or start daily health logging from the Health Hub.
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white"
        type="button"
        onClick={onOpenHub}
      >
        Open Health Hub
      </button>
    </div>
  );
}

function AllergyEditor({ items, onChange }: { items: Allergy[]; onChange: (items: Allergy[]) => void }) {
  return (
    <NestedListEditor
      title="Allergies"
      empty="No allergies added yet."
      onAdd={() => onChange([...items, { name: "", reaction: "", severity: "", notes: "" }])}
    >
      {items.map((item, index) => (
        <EditorRow key={index} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
          <FormField label="Name">
            <input className={fieldClass} value={item.name} onChange={(event) => updateNested(items, onChange, index, "name", event.target.value)} />
          </FormField>
          <FormField label="Reaction">
            <input className={fieldClass} value={item.reaction} onChange={(event) => updateNested(items, onChange, index, "reaction", event.target.value)} />
          </FormField>
          <FormField label="Severity">
            <input className={fieldClass} value={item.severity} onChange={(event) => updateNested(items, onChange, index, "severity", event.target.value)} />
          </FormField>
          <FormField label="Notes">
            <input className={fieldClass} value={item.notes} onChange={(event) => updateNested(items, onChange, index, "notes", event.target.value)} />
          </FormField>
        </EditorRow>
      ))}
      {items.length === 0 ? <EmptyEditorText text="No allergies added yet." /> : null}
    </NestedListEditor>
  );
}

function ConditionEditor({ items, onChange }: { items: KnownCondition[]; onChange: (items: KnownCondition[]) => void }) {
  return (
    <NestedListEditor
      title="Known conditions"
      empty="No conditions added yet."
      onAdd={() => onChange([...items, { name: "", diagnosed_year: "", status: "", notes: "" }])}
    >
      {items.map((item, index) => (
        <EditorRow key={index} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
          <FormField label="Condition">
            <input className={fieldClass} value={item.name} onChange={(event) => updateNested(items, onChange, index, "name", event.target.value)} />
          </FormField>
          <FormField label="Diagnosed year">
            <input className={fieldClass} inputMode="numeric" value={item.diagnosed_year} onChange={(event) => updateNested(items, onChange, index, "diagnosed_year", event.target.value)} />
          </FormField>
          <FormField label="Status">
            <input className={fieldClass} value={item.status} onChange={(event) => updateNested(items, onChange, index, "status", event.target.value)} />
          </FormField>
          <FormField label="Notes">
            <input className={fieldClass} value={item.notes} onChange={(event) => updateNested(items, onChange, index, "notes", event.target.value)} />
          </FormField>
        </EditorRow>
      ))}
      {items.length === 0 ? <EmptyEditorText text="No conditions added yet." /> : null}
    </NestedListEditor>
  );
}

function FamilyHistoryEditor({ items, onChange }: { items: FamilyHistoryItem[]; onChange: (items: FamilyHistoryItem[]) => void }) {
  return (
    <NestedListEditor
      title="Family history"
      empty="No family history added yet."
      onAdd={() => onChange([...items, { relation: "", condition: "", notes: "" }])}
    >
      {items.map((item, index) => (
        <EditorRow key={index} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
          <FormField label="Relation">
            <input className={fieldClass} value={item.relation} onChange={(event) => updateNested(items, onChange, index, "relation", event.target.value)} />
          </FormField>
          <FormField label="Condition">
            <input className={fieldClass} value={item.condition} onChange={(event) => updateNested(items, onChange, index, "condition", event.target.value)} />
          </FormField>
          <FormField label="Notes">
            <input className={fieldClass} value={item.notes} onChange={(event) => updateNested(items, onChange, index, "notes", event.target.value)} />
          </FormField>
        </EditorRow>
      ))}
      {items.length === 0 ? <EmptyEditorText text="No family history added yet." /> : null}
    </NestedListEditor>
  );
}

function ContactEditor({ items, onChange }: { items: EmergencyContact[]; onChange: (items: EmergencyContact[]) => void }) {
  return (
    <NestedListEditor
      title="Emergency contacts"
      empty="No emergency contacts added yet."
      onAdd={() => onChange([...items, { name: "", relation: "", phone: "", email: "", is_primary: items.length === 0 }])}
    >
      {items.map((item, index) => (
        <EditorRow key={index} onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
          <FormField label="Name">
            <input className={fieldClass} value={item.name} onChange={(event) => updateNested(items, onChange, index, "name", event.target.value)} />
          </FormField>
          <FormField label="Relation">
            <input className={fieldClass} value={item.relation} onChange={(event) => updateNested(items, onChange, index, "relation", event.target.value)} />
          </FormField>
          <FormField label="Phone">
            <input className={fieldClass} value={item.phone} onChange={(event) => updateNested(items, onChange, index, "phone", event.target.value)} />
          </FormField>
          <FormField label="Email">
            <input className={fieldClass} type="email" value={item.email} onChange={(event) => updateNested(items, onChange, index, "email", event.target.value)} />
          </FormField>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
            <input className="h-5 w-5" type="checkbox" checked={item.is_primary} onChange={(event) => updateNested(items, onChange, index, "is_primary", event.target.checked)} />
            Primary contact
          </label>
        </EditorRow>
      ))}
      {items.length === 0 ? <EmptyEditorText text="No emergency contacts added yet." /> : null}
    </NestedListEditor>
  );
}

function NestedListEditor({
  title,
  onAdd,
  children
}: {
  title: string;
  empty: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-claro-muted p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-claro-ink">{title}</h3>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-claro-blue px-3 text-sm font-semibold text-white" type="button" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function EditorRow({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-md border border-claro-border bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
      <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700" type="button" onClick={onRemove}>
        <Trash2 className="h-4 w-4" aria-hidden />
        Remove
      </button>
    </div>
  );
}

function EmptyEditorText({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">{text}</p>;
}

function updateNested<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  onChange: (items: T[]) => void,
  index: number,
  key: K,
  value: T[K]
) {
  onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
}

function calculateCompletion(profile: ProfilePayload) {
  const values = [
    profile.age,
    profile.gender,
    profile.height_cm,
    profile.weight_kg,
    profile.blood_group,
    profile.occupation,
    profile.exercise,
    profile.sleep_hours,
    profile.preferred_language,
    profile.food_preference,
    profile.location,
    profile.privacy_consent
  ];
  const completed = values.filter((value) => value !== "" && value !== false && value !== null).length;
  return Math.round((completed / values.length) * 100);
}

function validateProfile(profile: ProfilePayload) {
  if (profile.age !== "" && (profile.age < 0 || profile.age > 130)) return "Age must be between 0 and 130.";
  if (profile.height_cm && (Number(profile.height_cm) < 30 || Number(profile.height_cm) > 260)) return "Height must be between 30 and 260 cm.";
  if (profile.weight_kg && (Number(profile.weight_kg) < 1 || Number(profile.weight_kg) > 350)) return "Weight must be between 1 and 350 kg.";
  if (profile.sleep_hours && (Number(profile.sleep_hours) < 0 || Number(profile.sleep_hours) > 24)) return "Sleep hours must be between 0 and 24.";
  if (!profile.privacy_consent) return "Please confirm privacy consent before saving AI profile context.";
  return "";
}

function toApiPayload(profile: ProfilePayload) {
  return {
    age: profile.age === "" ? null : profile.age,
    gender: profile.gender,
    height_cm: profile.height_cm || null,
    weight_kg: profile.weight_kg || null,
    blood_group: profile.blood_group,
    occupation: profile.occupation,
    smoking: profile.smoking,
    alcohol: profile.alcohol,
    exercise: profile.exercise,
    sleep_hours: profile.sleep_hours || null,
    pregnancy_status: profile.gender === "male" ? "" : profile.pregnancy_status,
    preferred_language: profile.preferred_language,
    food_preference: profile.food_preference,
    location: profile.location,
    privacy_consent: profile.privacy_consent,
    allergies: profile.allergies.filter((item) => item.name.trim()),
    known_conditions: profile.known_conditions
      .filter((item) => item.name.trim())
      .map((item) => ({
        ...item,
        diagnosed_year: item.diagnosed_year ? Number(item.diagnosed_year) : null
      })),
    family_history: profile.family_history.filter((item) => item.relation.trim() && item.condition.trim()),
    emergency_contacts: profile.emergency_contacts.filter((item) => item.name.trim() && item.phone.trim())
  };
}

function mapProfileResponse(data: ProfileResponse): ProfilePayload {
  return {
    ...initialProfile,
    ...data,
    age: data.age ?? "",
    height_cm: data.height_cm ?? "",
    weight_kg: data.weight_kg ?? "",
    sleep_hours: data.sleep_hours ?? "",
    allergies: data.allergies ?? [],
    known_conditions:
      data.known_conditions?.map((item) => ({
        ...item,
        diagnosed_year: item.diagnosed_year ? String(item.diagnosed_year) : ""
      })) ?? [],
    family_history: data.family_history ?? [],
    emergency_contacts: data.emergency_contacts ?? []
  };
}
