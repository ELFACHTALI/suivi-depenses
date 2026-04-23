import { cn } from "../../lib/utils.ts";

interface ProgressBarProps {
  value: number; // 0–100
  variant?: "success" | "warning" | "danger";
  className?: string;
}

export default function ProgressBar({ value, variant, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const auto = value >= 100 ? "danger" : value >= 80 ? "warning" : "success";
  const v = variant ?? auto;
  const colors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return (
    <div className={cn("h-1.5 bg-surface-border rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[v])}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
