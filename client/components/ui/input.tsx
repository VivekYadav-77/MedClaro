import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 " +
        "placeholder:text-slate-400 " +
        "transition-shadow duration-150 " +
        "focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 " +
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
        className
      )}
      {...props}
    />
  );
}
