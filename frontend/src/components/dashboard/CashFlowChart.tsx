import Card, { CardHeader } from "../ui/Card.tsx";
import { formatCurrency } from "../../lib/utils.ts";

interface DataPoint { month: string; income: number; expenses: number; }

interface CashFlowChartProps { data?: DataPoint[]; currency?: string; }

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

export default function CashFlowChart({ data, currency = "MAD" }: CashFlowChartProps) {
  const W = 420;
  const H = 120;
  const PAD = { top: 12, bottom: 24, left: 8, right: 8 };

  const defaultData: DataPoint[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
      income: 0,
      expenses: 0,
    };
  });

  const pts = data ?? defaultData;
  const allValues = pts.flatMap((p) => [p.income, p.expenses]);
  const max = Math.max(...allValues, 1);

  const xStep = (W - PAD.left - PAD.right) / (pts.length - 1);
  const yScale = (v: number) =>
    PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);

  const incomePts = pts.map((p, i) => ({ x: PAD.left + i * xStep, y: yScale(p.income) }));
  const expPts = pts.map((p, i) => ({ x: PAD.left + i * xStep, y: yScale(p.expenses) }));

  return (
    <Card>
      <CardHeader
        title="Flux de trésorerie"
        action={
          <div className="flex gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block" /> Revenus</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-danger inline-block" /> Dépenses</span>
          </div>
        }
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axe X — mois */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={PAD.left + i * xStep}
            y={H - 4}
            textAnchor="middle"
            className="fill-text-tertiary"
            style={{ fontSize: 9, fontFamily: "DM Sans" }}
          >
            {p.month}
          </text>
        ))}
        {/* Ligne revenus */}
        <path d={buildPath(incomePts)} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        {/* Ligne dépenses */}
        <path d={buildPath(expPts)} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
        {/* Points */}
        {incomePts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#16a34a" />
        ))}
        {expPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#dc2626" />
        ))}
      </svg>
    </Card>
  );
}
