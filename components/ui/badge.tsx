import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-emerald-200 bg-emerald-50 text-emerald-700",
        critical: "border-red-200 bg-red-50 text-red-700",
        high: "border-orange-200 bg-orange-50 text-orange-700",
        moderate: "border-amber-200 bg-amber-50 text-amber-700",
        low: "border-sky-200 bg-sky-50 text-sky-700",
        outline: "border-stone-200 bg-stone-50 text-stone-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
