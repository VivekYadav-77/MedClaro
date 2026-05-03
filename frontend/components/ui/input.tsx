import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-11 w-full rounded-2xl border border-[#cde4e2] bg-white px-4 text-sm text-ink outline-none ring-0 placeholder:text-[#6b8292]", className)}
      {...props}
    />
  );
}
