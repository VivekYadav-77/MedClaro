import { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("min-h-[var(--control-min-height)] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20", className)}
      {...props}
    >
      {children}
    </select>
  );
}
