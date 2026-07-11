"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Languages,
  ShieldCheck,
  UserRound
} from "lucide-react";

type ProfilePayload = {
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
};

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
  privacy_consent: false
};

const fieldClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const completion = useMemo(() => {
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
    const completed = values.filter((value) => value !== "" && value !== false).length;
    return Math.round((completed / values.length) * 100);
  }, [profile]);

  function update<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    const payload = {
      ...profile,
      age: profile.age === "" ? null : profile.age,
      allergies: [],
      known_conditions: [],
      family_history: [],
      emergency_contacts: []
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/profiles/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Token ${token}` } : {})
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok && response.status !== 409) {
        throw new Error("Profile save failed");
      }

      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
                Personal Health Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Onboarding Foundation
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                This profile becomes the bounded context for report analysis,
                medication intelligence, trends, and assistant responses.
              </p>
            </div>
            <div className="min-w-56 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <HeartPulse className="h-4 w-4 text-claro-blue" />
                Completion
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-claro-mint"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-2 text-2xl font-semibold text-claro-ink">
                {completion}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <form className="mx-auto max-w-6xl px-6 py-8" onSubmit={saveProfile}>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Basic Details
                </h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Age
                  <input
                    className={fieldClass}
                    max={130}
                    min={0}
                    type="number"
                    value={profile.age}
                    onChange={(event) =>
                      update(
                        "age",
                        event.target.value === "" ? "" : Number(event.target.value)
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Gender
                  <select
                    className={fieldClass}
                    value={profile.gender}
                    onChange={(event) => update("gender", event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Height cm
                  <input
                    className={fieldClass}
                    type="number"
                    value={profile.height_cm}
                    onChange={(event) => update("height_cm", event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Weight kg
                  <input
                    className={fieldClass}
                    type="number"
                    value={profile.weight_kg}
                    onChange={(event) => update("weight_kg", event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Blood group
                  <select
                    className={fieldClass}
                    value={profile.blood_group}
                    onChange={(event) => update("blood_group", event.target.value)}
                  >
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"].map(
                      (group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Occupation
                  <input
                    className={fieldClass}
                    value={profile.occupation}
                    onChange={(event) => update("occupation", event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Lifestyle And Care Context
                </h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Smoking
                  <select
                    className={fieldClass}
                    value={profile.smoking}
                    onChange={(event) => update("smoking", event.target.value)}
                  >
                    <option value="never">Never</option>
                    <option value="former">Former</option>
                    <option value="occasional">Occasional</option>
                    <option value="regular">Regular</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Alcohol
                  <select
                    className={fieldClass}
                    value={profile.alcohol}
                    onChange={(event) => update("alcohol", event.target.value)}
                  >
                    <option value="never">Never</option>
                    <option value="former">Former</option>
                    <option value="occasional">Occasional</option>
                    <option value="regular">Regular</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Exercise
                  <input
                    className={fieldClass}
                    value={profile.exercise}
                    onChange={(event) => update("exercise", event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Sleep hours
                  <input
                    className={fieldClass}
                    max={24}
                    min={0}
                    type="number"
                    value={profile.sleep_hours}
                    onChange={(event) => update("sleep_hours", event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Pregnancy status
                  <input
                    className={fieldClass}
                    value={profile.pregnancy_status}
                    onChange={(event) =>
                      update("pregnancy_status", event.target.value)
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Location
                  <input
                    className={fieldClass}
                    value={profile.location}
                    onChange={(event) => update("location", event.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-claro-blue" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Preferences
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Preferred language
                  <input
                    className={fieldClass}
                    value={profile.preferred_language}
                    onChange={(event) =>
                      update("preferred_language", event.target.value)
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Food preference
                  <select
                    className={fieldClass}
                    value={profile.food_preference}
                    onChange={(event) =>
                      update("food_preference", event.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non_vegetarian">Non-vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  API token
                  <input
                    className={fieldClass}
                    placeholder="Paste token from registration/login"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-claro-mint" />
                <h2 className="text-lg font-semibold text-claro-ink">
                  Privacy Consent
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                MedClaro uses this profile as private health context for
                educational explanations. It should not be used as a diagnosis
                or a replacement for qualified medical care.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  checked={profile.privacy_consent}
                  type="checkbox"
                  onChange={(event) =>
                    update("privacy_consent", event.target.checked)
                  }
                />
                I consent to storing my Personal Health Profile for MedClaro
                health intelligence features.
              </label>
              <button
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                Save Profile
              </button>
              {status === "saved" ? (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-claro-mint">
                  <CheckCircle2 className="h-4 w-4" />
                  Profile request completed.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-claro-rose">
                  <AlertCircle className="h-4 w-4" />
                  Could not save profile with the current token.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
}
