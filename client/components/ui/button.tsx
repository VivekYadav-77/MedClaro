import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: pointer-events-auto ensures clicks always register
  "relative inline-flex min-h-[var(--control-min-height)] items-center justify-center gap-2 rounded-lg text-base font-semibold " +
  "transition-all duration-150 pointer-events-auto select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
        soft:
          "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        teal:
          "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800",
      },
      size: {
        sm:  "min-h-10 px-3 text-sm",
        default: "px-4",
        lg:  "min-h-12 px-6 text-lg",
        icon: "h-11 w-11",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
