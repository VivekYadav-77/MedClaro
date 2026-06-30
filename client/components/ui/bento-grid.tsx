"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface BentoGridProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function BentoGridItem({ children, className, ...props }: BentoGridProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      className={cn("h-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
