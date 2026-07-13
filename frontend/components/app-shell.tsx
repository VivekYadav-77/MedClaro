"use client";

import {
  Activity,
  Bell,
  CircleHelp,
  FileText,
  HeartPulse,
  Home,
  Languages,
  LifeBuoy,
  LogOut,
  Menu,
  Pill,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  TestTube2,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/design-system";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
};

const primaryNavItems: NavItem[] = [
  { href: "/hub", label: "Health Hub", shortLabel: "Hub", icon: Home },
  { href: "/profile", label: "Profile", icon: HeartPulse },
  { href: "/documents", label: "Medical Vault", shortLabel: "Vault", icon: FileText },
  { href: "/reports", label: "Report Insights", shortLabel: "Reports", icon: FileText },
  { href: "/prescriptions", label: "Medicines", icon: Pill },
  { href: "/trends", label: "Timeline & Trends", shortLabel: "Trends", icon: Activity },
  { href: "/daily", label: "Daily Health", shortLabel: "Daily", icon: HeartPulse },
  { href: "/family", label: "Family Care", shortLabel: "Family", icon: Users },
  { href: "/accessibility", label: "Access & Language", shortLabel: "Access", icon: Languages }
];

const secondaryNavItems: NavItem[] = [
  { href: "/accessibility", label: "Settings", icon: Settings },
  { href: "/medical-disclaimer", label: "Help & Safety", icon: CircleHelp },
  { href: "/future", label: "Future Ecosystem", icon: LifeBuoy },
  { href: "/readiness", label: "Release Readiness", icon: TestTube2 }
];

const mobileNavItems = primaryNavItems.slice(0, 5);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-claro-background md:grid md:grid-cols-[72px_1fr] xl:grid-cols-[288px_1fr]">
      <SideNav />
      <TabletRail />

      <div className="min-w-0 pb-20 md:pb-0">
        <TopBar />
        <main className="min-w-0">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-claro-border bg-white shadow-shell xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <BrandBlock />

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
          <NavSection title="Primary">
            {primaryNavItems.map((item) => (
              <NavLink item={item} key={item.href} active={pathname === item.href} />
            ))}
          </NavSection>

          <NavSection title="Secondary">
            {secondaryNavItems.map((item) => (
              <NavLink item={item} key={item.href} active={pathname === item.href} compact />
            ))}
          </NavSection>
        </nav>

        <SafetyPanel />
      </div>
    </aside>
  );
}

export function TabletRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-claro-border bg-white shadow-shell md:block xl:hidden">
      <div className="sticky top-0 flex h-screen flex-col items-center gap-3 py-4">
        <Link
          className="grid h-11 w-11 place-items-center rounded-md bg-claro-blue text-white"
          href="/hub"
          aria-label="MedClaro Health Hub"
        >
          <HeartPulse className="h-5 w-5" aria-hidden />
        </Link>

        <nav className="flex flex-1 flex-col gap-2" aria-label="Compact primary navigation">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip label={item.label} key={item.href}>
                <Link
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-md transition",
                    isActive
                      ? "bg-blue-50 text-claro-blue"
                      : "text-slate-600 hover:bg-slate-100 hover:text-claro-ink"
                  )}
                  href={item.href}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" aria-hidden />
                </Link>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function TopBar() {
  const { isReady, isSignedIn, signOut, user } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-claro-border bg-white/95 shadow-shell backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 md:hidden"
            type="button"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link className="flex items-center gap-2 md:hidden" href="/hub">
            <HeartPulse className="h-5 w-5 text-claro-blue" aria-hidden />
            <span className="font-semibold text-claro-ink">MedClaro</span>
          </Link>

          <div className="hidden min-h-11 w-[min(42vw,520px)] items-center gap-2 rounded-md border border-claro-border bg-claro-muted px-3 text-sm text-slate-500 sm:flex">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Search documents, medicines, timeline, and education</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TopIcon href="/family" label="Emergency profile">
            <QrCode className="h-4 w-4" aria-hidden />
          </TopIcon>
          <TopIcon href="/accessibility" label="Language and accessibility">
            <Languages className="h-4 w-4" aria-hidden />
          </TopIcon>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
            type="button"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" aria-hidden />
          </button>

          {isReady && isSignedIn ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
              className="inline-flex min-h-11 items-center rounded-md bg-claro-blue px-3 text-sm font-semibold text-white hover:bg-blue-700"
              href="/signin"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-claro-border bg-white shadow-shell md:hidden"
      aria-label="Mobile primary navigation"
    >
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold",
              isActive ? "text-claro-blue" : "text-slate-600"
            )}
            href={item.href}
            key={item.href}
          >
            <item.icon className="h-5 w-5" aria-hidden />
            <span className="truncate">{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock() {
  return (
    <div className="border-b border-claro-border px-5 py-5">
      <Link className="flex items-center gap-3" href="/hub">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-claro-blue text-white">
          <HeartPulse className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-lg font-semibold text-claro-ink">MedClaro</span>
          <span className="block text-sm text-slate-500">Health intelligence</span>
        </span>
      </Link>
    </div>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

function NavLink({
  item,
  active,
  compact = false
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
        active ? "bg-blue-50 text-claro-blue" : "text-slate-700 hover:bg-slate-100",
        compact && "text-sm font-medium"
      )}
      href={item.href}
    >
      <item.icon className="h-4 w-4" aria-hidden />
      {item.label}
    </Link>
  );
}

function SafetyPanel() {
  return (
    <div className="border-t border-claro-border p-4">
      <div className="rounded-md border border-claro-border bg-claro-muted p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-claro-ink">
          <ShieldCheck className="h-4 w-4 text-claro-mint" aria-hidden />
          Not a diagnosis
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          MedClaro explains records, flags uncertainty, and prepares questions for
          qualified care.
        </p>
      </div>
    </div>
  );
}

function TopIcon({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <Link
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
        href={href}
        aria-label={label}
      >
        {children}
      </Link>
    </Tooltip>
  );
}
