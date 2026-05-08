"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { FamilyMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FamilySwitcher({ members }: { members: FamilyMember[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const selectedMember = members.find((member) => member.id === selectedMemberId);

  useEffect(() => {
    setSelectedMemberId(window.localStorage.getItem("selectedFamilyMemberId"));
  }, []);

  // Close on outside click — this fixes the "dropdown stays open" bug
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function switchTo(memberId: string | null) {
    if (memberId) {
      window.localStorage.setItem("selectedFamilyMemberId", memberId);
    } else {
      window.localStorage.removeItem("selectedFamilyMemberId");
    }
    setSelectedMemberId(memberId);
    window.dispatchEvent(new CustomEvent("family-profile-change", { detail: { memberId } }));
    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {selectedMember ? selectedMember.name.slice(0, 2).toUpperCase() : "Me"}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{selectedMember?.name ?? "My Profile"}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-dialog">
          {/* Current user */}
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Viewing As</p>
            <button
              className={cn(
                "mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left",
                selectedMemberId ? "hover:bg-slate-50" : "bg-brand-50"
              )}
              onClick={() => switchTo(null)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                Me
              </span>
              <span className="text-sm font-medium text-slate-900">My Profile</span>
            </button>
          </div>

          {/* Family members */}
          {members.length > 0 && (
            <div className="px-3 py-2">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Family</p>
              {members.map((member) => (
                <button
                  key={member.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors",
                    selectedMemberId === member.id ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                  onClick={() => switchTo(member.id)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <span className="block font-medium">{member.name}</span>
                    <span className="block text-xs text-slate-400">{member.relationship}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Sign out */}
          <div className="border-t border-slate-100 px-3 py-2">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
