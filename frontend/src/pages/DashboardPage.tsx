import { useState } from "react";
import { useDashboard } from "../hooks/useDashboard.ts";
import { currentMonth } from "../lib/utils.ts";
import PeriodSelector from "../components/shared/PeriodSelector.tsx";
import StatsGrid from "../components/dashboard/StatsGrid.tsx";
import CashFlowChart from "../components/dashboard/CashFlowChart.tsx";
import RecentTransactions from "../components/dashboard/RecentTransactions.tsx";
import FinancialHealthScore from "../components/dashboard/FinancialHealthScore.tsx";
import BudgetSummary from "../components/dashboard/BudgetSummary.tsx";
import Button from "../components/ui/Button.tsx";
import Spinner from "../components/ui/Spinner.tsx";
import { useAuthStore } from "../store/auth.ts";
import TransactionForm from "../components/transactions/TransactionForm.tsx";

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function nextMonthStr(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useDashboard(month);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const d = data as any;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Tableau de bord</h1>
          <p className="text-sm text-text-secondary">Bonjour, {user?.name?.split(" ")[0]} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            month={month}
            onPrev={() => setMonth(prevMonth(month))}
            onNext={() => setMonth(nextMonthStr(month))}
          />
          <Button onClick={() => setShowForm(true)}>+ Dépense</Button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid
        netBalance={d?.netBalance ?? 0}
        income={d?.monthly?.income ?? 0}
        expenses={d?.monthly?.expenses ?? 0}
        savingsRate={d?.monthly?.savingsRate ?? 0}
        incomeChange={d?.monthly?.incomeChange}
        expensesChange={d?.monthly?.expensesChange}
        currency={user?.referenceCurrency}
      />

      {/* Charts + Score + Transactions + Budgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <CashFlowChart currency={user?.referenceCurrency} />
          <RecentTransactions transactions={d?.recentTransactions} />
        </div>
        <div className="space-y-6">
          {d?.healthScore ? (
            <FinancialHealthScore
              score={d.healthScore.score}
              tips={d.healthScore.tips ?? []}
            />
          ) : (
            <div className="bg-white border border-surface-border rounded-lg p-5">
              <p className="text-sm text-text-secondary text-center">
                Score santé disponible après la première semaine de saisie
              </p>
            </div>
          )}
          <BudgetSummary budgets={d?.topBudgets} />
        </div>
      </div>

      <TransactionForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
