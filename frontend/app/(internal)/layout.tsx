"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { UnauthorizedState } from "@/components/app-states";
import { useSession } from "@/lib/session";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isSignedIn } = useSession();

  if (isReady && !isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <Link className="inline-flex min-h-11 items-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white" href="/signin">
              Sign in
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-amber-900">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            <p className="font-semibold">Internal planning surface</p>
          </div>
          <Link className="text-sm font-semibold text-claro-blue" href="/hub">
            Return to Health Hub
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
