import { Link } from "react-router-dom";
import Card, { CardHeader } from "../ui/Card.tsx";
import ProgressBar from "../ui/ProgressBar.tsx";
import { formatCurrency } from "../../lib/utils.ts";
import type { Budget } from "../../hooks/useDashboard.ts";

export default function BudgetSummary({ budgets }: { budgets?: Budget[] }) {
  return (
    <Card>
      <CardHeader
        title="Budgets du mois"
        action={
          <Link to="/budgets" className="text-xs text-text-secondary hover:text-text-primary">
            Voir tout →
          </Link>
        }
      />
      {!budgets?.length ? (
        <p className="text-sm text-text-tertiary text-center py-4">Aucun budget défini</p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => (
            <li key={b.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary">
                  {b.categoryIcon} {b.categoryName}
                </span>
                <span className="text-xs text-text-tertiary font-mono">
                  {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                </span>
              </div>
              <ProgressBar value={b.pct} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
