import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-[120px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20", className)}
      {...props}
    />
  );
}
