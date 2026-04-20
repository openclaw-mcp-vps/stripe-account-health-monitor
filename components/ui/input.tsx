import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#334155] bg-[#0f172a]/70 px-3 py-2 text-sm text-[#e6edf3] ring-offset-[#0d1117] placeholder:text-[#64748b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb8ff]/70 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
