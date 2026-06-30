"use client";

import { FormEvent, useState } from "react";
import { Save, Trash2, UserPlus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FamilyMember, UserProfile } from "@/lib/types";

export function FamilyClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [members, setMembers] = useState(user.familyMembers);
  const [allergyDrafts, setAllergyDrafts] = useState<Record<string, string>>(
    Object.fromEntries(user.familyMembers.map((member) => [member.id, formatAllergies(member.allergies ?? [])])),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    dob: "",
    biologicalSex: "undisclosed",
    allergies: ""
  });

  const headers = {
    "Content-Type": "application/json",
    ...((session as any)?.accessToken ? { Authorization: `Bearer ${(session as any).accessToken}` } : {})
  };

  const addMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!process.env.NEXT_PUBLIC_API_URL || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/family`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, allergies: parseAllergies(form.allergies) })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not add family member.");
      }
      const member = (await response.json()) as FamilyMember;
      setMembers((current) => [...current, member]);
      setAllergyDrafts((current) => ({ ...current, [member.id]: formatAllergies(member.allergies ?? []) }));
      setForm({ name: "", relationship: "", dob: "", biologicalSex: "undisclosed", allergies: "" });
      setFormOpen(false);
      router.refresh();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add family member.");
    } finally {
      setSaving(false);
    }
  };

  const saveMemberAllergies = async (memberId: string) => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/family/${memberId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ allergies: parseAllergies(allergyDrafts[memberId] ?? "") })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not save allergies.");
      const updated = payload as FamilyMember;
      setMembers((current) => current.map((member) => (member.id === memberId ? updated : member)));
      setAllergyDrafts((current) => ({ ...current, [memberId]: formatAllergies(updated.allergies ?? []) }));
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save allergies.");
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/family/${memberId}`, {
        method: "DELETE",
        headers
      });
      if (!response.ok) throw new Error("Could not delete family member.");
      setMembers((current) => current.filter((member) => member.id !== memberId));
      if (window.localStorage.getItem("selectedFamilyMemberId") === memberId) {
        window.localStorage.removeItem("selectedFamilyMemberId");
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete family member.");
    }
  };

  const switchProfile = (memberId: string) => {
    window.localStorage.setItem("selectedFamilyMemberId", memberId);
    router.push("/dashboard");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fade-in pb-12">
      <BentoCard className="md:col-span-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Family profiles</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 tracking-tight">Care Circles</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
              Separate histories for the people you help manage. Each family member keeps their own report timeline, explanation history, and access context.
            </p>
          </div>
          <Button className="gap-2 rounded-xl" onClick={() => setFormOpen((current) => !current)} disabled={members.length >= 5}>
            <UserPlus className="h-4 w-4" />
            Add family member
          </Button>
        </div>

        {formOpen ? (
          <form className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2" onSubmit={addMember}>
            <Input required placeholder="Name" className="rounded-xl" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input
              required
              placeholder="Relationship (e.g., Father)"
              className="rounded-xl"
              value={form.relationship}
              onChange={(event) => setForm({ ...form, relationship: event.target.value })}
            />
            <Input required type="date" className="rounded-xl" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} />
            <Select value={form.biologicalSex} onChange={(event) => setForm({ ...form, biologicalSex: event.target.value })}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Other</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
            <textarea
              className="min-h-[100px] rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 md:col-span-2"
              value={form.allergies}
              onChange={(event) => setForm({ ...form, allergies: event.target.value })}
              placeholder="Medicine allergies, one per line. Example: Penicillin - rash"
            />
            <div className="flex gap-2 md:col-span-2 pt-2">
              <Button type="submit" className="rounded-xl px-6" disabled={saving}>
                {saving ? "Adding..." : "Save Member"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</p> : null}
      </BentoCard>

      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => (
          <BentoCard key={member.id} className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50/50">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
                  <UsersRound className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-slate-900">{member.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{member.relationship}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${member.name}`} onClick={() => void deleteMember(member.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
              <div className="rounded-xl bg-white p-2 border border-slate-100">
                <p className="text-[10px] font-bold uppercase text-slate-400">DOB</p>
                <p className="font-medium mt-0.5">{new Date(member.dob).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl bg-white p-2 border border-slate-100">
                <p className="text-[10px] font-bold uppercase text-slate-400">Sex</p>
                <p className="font-medium mt-0.5 capitalize">{member.biologicalSex}</p>
              </div>
            </div>
            
            <div className="space-y-2 flex-grow">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Medicine Allergies</label>
              <textarea
                className="min-h-[86px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                value={allergyDrafts[member.id] ?? ""}
                onChange={(event) => setAllergyDrafts((current) => ({ ...current, [member.id]: event.target.value }))}
                placeholder="No allergies saved"
              />
              <Button variant="outline" size="sm" className="gap-2 rounded-lg w-full" onClick={() => void saveMemberAllergies(member.id)}>
                <Save className="h-4 w-4" />
                Save allergies
              </Button>
            </div>
            
            <div className="mt-5 pt-5 border-t border-slate-100">
              <Button variant="soft" className="w-full rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100" onClick={() => switchProfile(member.id)}>
                Switch to this profile
              </Button>
            </div>
          </BentoCard>
        ))}
        
        {members.length < 5 && !formOpen && (
          <BentoCard className="flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50 min-h-[320px] cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors" noPadding>
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center" onClick={() => setFormOpen(true)}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm mb-4">
                <UserPlus className="h-6 w-6" />
              </span>
              <p className="font-display font-bold text-slate-900 text-lg">Add Family Member</p>
              <p className="mt-1 text-sm text-slate-500">Manage up to {5 - members.length} more profiles.</p>
            </div>
          </BentoCard>
        )}
      </div>
    </div>
  );
}

function parseAllergies(raw: string) {
  return raw
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((line) => {
      const [name, ...reactionParts] = line.split(/\s+-\s+/);
      return { name: name.trim(), reaction: reactionParts.join(" - ").trim() };
    })
    .filter((item) => item.name);
}

function formatAllergies(allergies: { name: string; reaction?: string }[]) {
  return allergies.map((allergy) => [allergy.name, allergy.reaction].filter(Boolean).join(" - ")).join("\n");
}
