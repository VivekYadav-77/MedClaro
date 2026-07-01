import { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, Pill, ShieldAlert, Upload } from "lucide-react";

import { GlobalChatWidget } from "@/components/layout/global-chat-widget";
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
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 md:px-6" aria-label="Quick actions">
          <QuickAction href="/reports/upload" icon={Upload} label="Upload data" />
          <QuickAction href="/reports/medications" icon={Pill} label="Medicines" />
          <QuickAction href="/dashboard?panel=ice-card" icon={ShieldAlert} label="Emergency" />
          <QuickAction href="/reports/history" icon={ClipboardList} label="Doctor visit" />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-fade-in">
        {children}
      </main>
      <GlobalChatWidget />
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-800"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
