import Card, { CardHeader } from "../ui/Card.tsx";

interface HealthScoreProps {
  score: number;
  tips?: string[];
}

export default function FinancialHealthScore({ score, tips = [] }: HealthScoreProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";

  return (
    <Card>
      <CardHeader title="Score santé financière" />
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="#e8e6e1" strokeWidth="10" />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold font-mono" style={{ color }}>{score}</span>
            <span className="text-[10px] text-text-tertiary">/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">
              • {tip}
            </p>
          ))}
          {tips.length === 0 && (
            <p className="text-xs text-text-tertiary">Calculé chaque lundi</p>
          )}
        </div>
      </div>
    </Card>
  );
}
