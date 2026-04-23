import { cn } from "../../lib/utils.ts";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "premium";

interface BadgeProps { variant?: Variant; children: React.ReactNode; className?: string; }

const variants: Record<Variant, string> = {
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  neutral: "bg-surface-secondary text-text-secondary",
  premium: "bg-amber-100 text-amber-700",
};

export default function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function alertBadge(alertLevel: string, pct: number) {
  if (alertLevel === "exceeded") return <Badge variant="danger">{pct}% dépassé</Badge>;
  if (alertLevel === "warning") return <Badge variant="warning">{pct}% utilisé</Badge>;
  if (alertLevel === "predictive") return <Badge variant="warning">Alerte prévision</Badge>;
  return <Badge variant="success">{pct}% utilisé</Badge>;
}
