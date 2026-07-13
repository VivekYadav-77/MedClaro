"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  ShieldAlert,
  ShieldCheck,
  X,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/ui";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  notice
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <section className="border-b border-claro-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-[26px] font-semibold leading-tight text-claro-ink sm:text-[32px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {notice ? <div className="mx-auto max-w-6xl px-6 pb-6 lg:px-8">{notice}</div> : null}
    </section>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-claro-blue" aria-hidden /> : null}
          <h2 className="text-xl font-semibold text-claro-ink">{title}</h2>
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  detail,
  tone = "info"
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  detail?: string;
  tone?: "info" | "success" | "attention" | "risk";
}) {
  const toneClass = {
    info: "text-claro-blue bg-blue-50",
    success: "text-claro-mint bg-emerald-50",
    attention: "text-claro-amber bg-amber-50",
    risk: "text-claro-rose bg-rose-50"
  }[tone];

  return (
    <div className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? (
          <span className={cn("grid h-9 w-9 place-items-center rounded-md", toneClass)}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-claro-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "attention" | "risk" | "critical";
}) {
  const classes = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-claro-blue ring-blue-200",
    success: "bg-emerald-50 text-claro-mint ring-emerald-200",
    attention: "bg-amber-50 text-amber-800 ring-amber-200",
    risk: "bg-rose-50 text-claro-rose ring-rose-200",
    critical: "bg-red-50 text-claro-critical ring-red-200"
  }[tone];

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-semibold ring-1", classes)}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase().replaceAll("_", " ");
  const tone =
    normalized.includes("critical") || normalized.includes("urgent")
      ? "critical"
      : normalized.includes("high") || normalized.includes("worsening")
        ? "risk"
        : normalized.includes("moderate") || normalized.includes("attention")
          ? "attention"
          : normalized.includes("stable") || normalized.includes("good")
            ? "success"
            : "neutral";

  return <StatusBadge tone={tone}>{normalized}</StatusBadge>;
}

export function SafetyNotice({
  title = "Not a diagnosis",
  children,
  tone = "info"
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "attention" | "risk";
}) {
  const Icon = tone === "risk" ? ShieldAlert : tone === "attention" ? AlertCircle : ShieldCheck;
  const classes = {
    info: "border-blue-200 bg-blue-50 text-slate-700",
    attention: "border-amber-200 bg-amber-50 text-amber-900",
    risk: "border-rose-200 bg-rose-50 text-claro-rose"
  }[tone];

  return (
    <div className={cn("rounded-md border p-4", classes)}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{title}</p>
          <div className="mt-1 text-sm leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PermissionNotice({
  title = "Permission-controlled access",
  children
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-claro-border bg-white p-4 shadow-panel">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-claro-mint" aria-hidden />
        <div>
          <p className="font-semibold text-claro-ink">{title}</p>
          <div className="mt-1 text-sm leading-6 text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-claro-border bg-white p-4 shadow-panel md:flex-row md:items-end">
      {children}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
  label = "Tabs"
}: {
  tabs: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-claro-border bg-claro-muted p-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-semibold transition",
            value === tab.value ? "bg-white text-claro-blue shadow-shell" : "text-slate-600 hover:bg-white"
          )}
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  label
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return <Tabs tabs={options} value={value} onChange={onChange} label={label} />;
}

export function Drawer({
  title,
  open,
  onClose,
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex min-h-16 items-center justify-between border-b border-claro-border px-5">
          <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
          <button className="grid h-11 w-11 place-items-center rounded-md text-slate-700 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Close drawer">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Modal({
  title,
  open,
  onClose,
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
        <div className="flex min-h-16 items-center justify-between border-b border-claro-border px-5">
          <h2 className="text-lg font-semibold text-claro-ink">{title}</h2>
          <button className="grid h-11 w-11 place-items-center rounded-md text-slate-700 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  open,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm"
}: {
  title: string;
  message: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  return (
    <Modal title={title} open={open} onClose={onCancel}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="min-h-11 rounded-md bg-claro-rose px-4 text-sm font-semibold text-white" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function FormField({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-2 text-sm font-medium text-claro-rose">{error}</p> : null}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-claro-border bg-white px-3 py-2">
      <span>
        <span className="block text-sm font-semibold text-claro-ink">{label}</span>
        {description ? <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span> : null}
      </span>
      <input className="h-5 w-5" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-claro-ink px-2 py-1 text-xs font-medium text-white group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}

export function InlineValidation({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-claro-rose">
      <AlertCircle className="h-4 w-4" aria-hidden />
      {children}
    </p>
  );
}

export function SuccessLine({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-claro-mint">
      <CheckCircle2 className="h-4 w-4" aria-hidden />
      {children}
    </p>
  );
}

export function InfoLine({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
      <Info className="h-4 w-4 text-claro-blue" aria-hidden />
      {children}
    </p>
  );
}

export function SelectChevron() {
  return <ChevronDown className="pointer-events-none h-4 w-4 text-slate-500" aria-hidden />;
}
