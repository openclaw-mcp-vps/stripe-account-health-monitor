import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "low" | "medium" | "high" | "critical";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-zinc-700 text-zinc-300",
  low: "border-emerald-600/60 text-emerald-300",
  medium: "border-amber-600/60 text-amber-300",
  high: "border-orange-600/60 text-orange-300",
  critical: "border-red-600/60 text-red-300"
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: BadgeVariant }): React.JSX.Element {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
