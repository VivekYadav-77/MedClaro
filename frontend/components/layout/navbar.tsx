import Link from "next/link";
import { Bell, HeartPulse } from "lucide-react";

import { FamilySwitcher } from "@/components/layout/family-switcher";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types";

export function Navbar({ user }: { user: UserProfile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-foam/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3 text-ink">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-xl">HealthStack</span>
            <span className="block text-xs text-[#6b8292]">Calm personal health intelligence</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-white">
            Timeline
          </Link>
          <Link href="/trends" className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-white">
            Trends
          </Link>
          <Link href="/family" className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-white">
            Family
          </Link>
          <Link href="/settings" className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-white">
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="soft" size="sm" className="rounded-full">
            <Bell className="mr-2 h-4 w-4" />
            Nudges
          </Button>
          <FamilySwitcher members={user.familyMembers} />
        </div>
      </div>
    </header>
  );
}
