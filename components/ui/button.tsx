import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[#238636] text-white hover:bg-[#2ea043]",
  secondary: "bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d]",
  ghost: "bg-transparent text-[#c9d1d9] hover:bg-[#21262d]",
  danger: "bg-[#da3633] text-white hover:bg-[#f85149]",
} as const;

const sizes = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6 text-base",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
