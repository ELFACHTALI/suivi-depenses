import Card from "../ui/Card.tsx";
import { formatCurrency } from "../../lib/utils.ts";

interface StatCardProps {
  label: string;
  value: string;
  change?: number | null;
  color?: string;
}

function StatCard({ label, value, change, color = "text-text-primary" }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
      {change != null && (
        <p className={`text-xs mt-1.5 ${change >= 0 ? "text-success" : "text-danger"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs mois précédent
        </p>
      )}
    </Card>
  );
}

interface StatsGridProps {
  netBalance: number;
  income: number;
  expenses: number;
  savingsRate: number;
  incomeChange?: number | null;
  expensesChange?: number | null;
  currency?: string;
}

export default function StatsGrid({
  netBalance,
  income,
  expenses,
  savingsRate,
  incomeChange,
  expensesChange,
  currency = "MAD",
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Solde net" value={formatCurrency(netBalance, currency)} />
      <StatCard
        label="Revenus du mois"
        value={formatCurrency(income, currency)}
        change={incomeChange}
        color="text-success"
      />
      <StatCard
        label="Dépenses du mois"
        value={formatCurrency(expenses, currency)}
        change={expensesChange}
        color="text-danger"
      />
      <StatCard
        label="Taux d'épargne"
        value={`${savingsRate}%`}
        color={savingsRate >= 20 ? "text-success" : "text-warning"}
      />
    </div>
  );
}
