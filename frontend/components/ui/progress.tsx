"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export function Progress({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-3 w-full overflow-hidden rounded-full bg-[#dcefed]", className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-sea to-leaf transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
