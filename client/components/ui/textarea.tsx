import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-[120px] w-full rounded-[24px] border border-[#cde4e2] bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-[#6b8292]", className)}
      {...props}
    />
  );
}
