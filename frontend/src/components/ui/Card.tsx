import { cn } from "../../lib/utils.ts";

interface CardProps { children: React.ReactNode; className?: string; }

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white border border-surface-border rounded-lg p-5", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {action}
    </div>
  );
}
