import { ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";
import { UserProfile } from "@/lib/types";

export function AppShell({
  user,
  children
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-shell text-ink">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
