import Button from "./Button.tsx";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ emoji = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-2">{action.label}</Button>
      )}
    </div>
  );
}
