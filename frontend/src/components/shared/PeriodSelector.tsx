import { cn } from "../../lib/utils.ts";

interface PeriodSelectorProps {
  month: string; // "YYYY-MM"
  onPrev: () => void;
  onNext: () => void;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function PeriodSelector({
  month,
  onPrev,
  onNext,
  tabs,
  activeTab,
  onTabChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      {tabs && onTabChange && (
        <div className="flex bg-surface-secondary rounded-sm p-0.5 gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
                activeTab === tab
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border border-surface-border rounded-sm px-3 py-1.5">
        <button onClick={onPrev} className="text-text-tertiary hover:text-text-primary text-sm">
          ◁
        </button>
        <span className="text-sm font-medium text-text-primary capitalize min-w-28 text-center">
          {formatMonthLabel(month)}
        </span>
        <button onClick={onNext} className="text-text-tertiary hover:text-text-primary text-sm">
          ▷
        </button>
      </div>
    </div>
  );
}
