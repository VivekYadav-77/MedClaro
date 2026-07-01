"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeartPulse, Menu, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAccessibilityPreferences } from "@/components/accessibility/accessibility-preferences";
import { FamilySwitcher } from "@/components/layout/family-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", key: "myReports" },
  { href: "/assistant", key: "askForHelp" },
  { href: "/trends", key: "healthTrends" },
  { href: "/circles", key: "familyCare" },
  { href: "/settings", key: "settings" },
] as const;

export function Navbar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { preferences, setAccessibilityMode } = useAccessibilityPreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const easyMode = preferences.accessibilityMode === "easy";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-slate-900 transition-opacity hover:opacity-80"
          aria-label="MedClaro home"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-lg font-bold leading-none text-slate-900">
              MedClaro
            </span>
            <span className="block text-sm leading-tight text-slate-600">
              Simple health help
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map(({ href, key }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-base font-semibold transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "hidden min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors sm:inline-flex",
              easyMode
                ? "border-brand-300 bg-brand-50 text-brand-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => setAccessibilityMode(easyMode ? "standard" : "easy")}
            aria-pressed={easyMode}
          >
            <Settings className="h-4 w-4" />
            {easyMode ? t("easyModeOn") : t("easyMode")}
          </button>
          <NotificationBell />
          <FamilySwitcher members={user.familyMembers} />

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="space-y-2 border-t border-slate-100 bg-white px-4 py-3 md:hidden animate-slide-up">
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-semibold",
              easyMode ? "bg-brand-50 text-brand-800" : "bg-slate-50 text-slate-800"
            )}
            onClick={() => setAccessibilityMode(easyMode ? "standard" : "easy")}
            aria-pressed={easyMode}
          >
            {t("easyMode")}
            <span className="text-sm">{easyMode ? t("on") : t("off")}</span>
          </button>
          {navLinks.map(({ href, key }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-800 hover:bg-slate-50"
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(key)}
              </Link>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
