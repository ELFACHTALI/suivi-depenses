import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-sm border border-surface-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
            "disabled:bg-surface-secondary disabled:cursor-not-allowed",
            error && "border-danger focus:ring-danger/30",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
