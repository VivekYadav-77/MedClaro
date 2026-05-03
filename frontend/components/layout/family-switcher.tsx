"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { FamilyMember } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FamilySwitcher({
  members
}: {
  members: FamilyMember[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="soft" className="gap-2" onClick={() => setOpen((value) => !value)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sea/20 text-xs font-bold text-ink">AM</span>
        Me
        <ChevronDown className="h-4 w-4" />
      </Button>
      {open ? (
        <Card className="absolute right-0 top-14 z-20 w-64 space-y-3 p-3">
          <div className="space-y-2">
            <button className="flex w-full items-center justify-between rounded-2xl bg-mist px-3 py-2 text-left text-sm font-medium text-ink">
              <span>Aarav Mehta</span>
              <Badge>Primary</Badge>
            </button>
            {members.map((member) => (
              <button key={member.id} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-ink hover:bg-mist">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tide text-xs font-bold">
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  {member.name}
                  <span className="block text-xs text-[#6b8292]">{member.relationship}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
