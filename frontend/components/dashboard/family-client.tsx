"use client";

import { FormEvent, useState } from "react";
import { Trash2, UserPlus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FamilyMember, UserProfile } from "@/lib/types";

export function FamilyClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [members, setMembers] = useState(user.familyMembers);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    dob: "",
    biologicalSex: "undisclosed"
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
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not add family member.");
      }
      const member = (await response.json()) as FamilyMember;
      setMembers((current) => [...current, member]);
      setForm({ name: "", relationship: "", dob: "", biologicalSex: "undisclosed" });
      setFormOpen(false);
      router.refresh();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add family member.");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Family profiles</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Separate histories for the people you help manage.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#355166]">
              Each family member keeps their own report timeline, explanation history, and access context, with a maximum of five linked sub-profiles.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setFormOpen((current) => !current)} disabled={members.length >= 5}>
            <UserPlus className="h-4 w-4" />
            Add family member
          </Button>
        </div>

        {formOpen ? (
          <form className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2" onSubmit={addMember}>
            <Input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input
              required
              placeholder="Relationship"
              value={form.relationship}
              onChange={(event) => setForm({ ...form, relationship: event.target.value })}
            />
            <Input required type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} />
            <Select value={form.biologicalSex} onChange={(event) => setForm({ ...form, biologicalSex: event.target.value })}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Other</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Save member"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => (
          <Card key={member.id} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-sea">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="text-sm text-[#6b8292]">{member.relationship}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Delete ${member.name}`} onClick={() => void deleteMember(member.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <div className="text-sm text-[#355166]">
              Date of birth: {new Date(member.dob).toLocaleDateString()}
              <br />
              Biological sex: {member.biologicalSex}
            </div>
            <Button variant="soft" className="w-full" onClick={() => switchProfile(member.id)}>
              Switch to this profile
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
