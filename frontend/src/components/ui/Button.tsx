import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils.ts";
import Spinner from "./Spinner.tsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-accent text-white hover:bg-accent-hover",
      ghost: "bg-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
      danger: "bg-danger text-white hover:bg-red-700",
      outline: "border border-surface-border text-text-primary hover:bg-surface-secondary",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
