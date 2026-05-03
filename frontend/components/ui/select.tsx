import { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11 w-full rounded-2xl border border-[#cde4e2] bg-white px-4 text-sm text-ink outline-none", className)}
      {...props}
    >
      {children}
    </select>
  );
}
