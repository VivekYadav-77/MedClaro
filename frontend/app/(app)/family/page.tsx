import { UsersRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/api";

export default async function FamilyPage() {
  const user = await getUserProfile();

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Family profiles</p>
        <h1 className="font-display text-4xl text-ink">Separate histories for the people you help manage.</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#355166]">
          Each family member keeps their own report timeline, explanation history, and access context, with a maximum of five linked sub-profiles.
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {user.familyMembers.map((member) => (
          <Card key={member.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-sea">
                <UsersRound className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{member.name}</p>
                <p className="text-sm text-[#6b8292]">{member.relationship}</p>
              </div>
            </div>
            <div className="text-sm text-[#355166]">
              Date of birth: {new Date(member.dob).toLocaleDateString()}
              <br />
              Biological sex: {member.biologicalSex}
            </div>
            <Button variant="soft" className="w-full">Switch to this profile</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
