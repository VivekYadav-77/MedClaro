"use client";

import {
  Activity,
  Bell,
  FileText,
  HeartPulse,
  Home,
  Languages,
  LogOut,
  Menu,
  Pill,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

const navItems = [
  { href: "/hub", label: "Health Hub", icon: Home },
  { href: "/profile", label: "Profile", icon: HeartPulse },
  { href: "/documents", label: "Medical Vault", icon: FileText },
  { href: "/reports", label: "Report Insights", icon: FileText },
  { href: "/prescriptions", label: "Medicines", icon: Pill },
  { href: "/trends", label: "Timeline & Trends", icon: Activity },
  { href: "/daily", label: "Daily Health", icon: HeartPulse },
  { href: "/family", label: "Family Care", icon: Users },
  { href: "/accessibility", label: "Access & Language", icon: Languages }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isReady, isSignedIn, signOut, user } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <Link className="flex items-center gap-3" href="/hub">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-claro-blue text-white">
                <HeartPulse className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-semibold text-claro-ink">
                  MedClaro
                </span>
                <span className="block text-sm text-slate-500">
                  Health intelligence
                </span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-50 text-claro-blue"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-claro-ink">
                <ShieldCheck className="h-4 w-4 text-claro-mint" aria-hidden />
                Not a diagnosis
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                MedClaro explains records and prepares questions for qualified care.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 lg:hidden"
                type="button"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <div className="hidden min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-500 sm:flex">
                <Search className="h-4 w-4" aria-hidden />
                Search planned for documents, medicines, and timeline
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700"
                type="button"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden />
              </button>
              {isReady && isSignedIn ? (
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700"
                  type="button"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">
                    {user?.username ?? user?.email ?? "Sign out"}
                  </span>
                </button>
              ) : (
                <Link
                  className="inline-flex min-h-11 items-center rounded-md bg-claro-blue px-3 text-sm font-semibold text-white"
                  href="/signin"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden"
        aria-label="Mobile primary"
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                isActive ? "text-claro-blue" : "text-slate-600"
              }`}
              href={item.href}
              key={item.href}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
