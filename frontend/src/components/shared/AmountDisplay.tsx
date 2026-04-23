import { cn, formatCurrency } from "../../lib/utils.ts";

interface AmountDisplayProps {
  cents: number;
  type?: "income" | "expense" | "transfer" | "neutral";
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AmountDisplay({
  cents,
  type = "neutral",
  currency = "MAD",
  className,
  size = "md",
}: AmountDisplayProps) {
  const isPositive = type === "income" || (type === "neutral" && cents >= 0);
  const abs = Math.abs(cents);

  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl font-semibold" };
  const colors = {
    income: "text-success",
    expense: "text-danger",
    transfer: "text-text-secondary",
    neutral: cents >= 0 ? "text-success" : "text-danger",
  };

  return (
    <span className={cn("font-mono", sizes[size], colors[type], className)}>
      {type === "income" || isPositive ? "+" : "-"}
      {formatCurrency(abs, currency)}
    </span>
  );
}
