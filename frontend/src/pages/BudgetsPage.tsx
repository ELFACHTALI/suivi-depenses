import { useState } from "react";
import { useBudgets, useCreateBudget, useCategories, useAccounts } from "../hooks/useDashboard.ts";
import { currentMonth, formatCurrency } from "../lib/utils.ts";
import Card from "../components/ui/Card.tsx";
import ProgressBar from "../components/ui/ProgressBar.tsx";
import Button from "../components/ui/Button.tsx";
import Badge, { alertBadge } from "../components/ui/Badge.tsx";
import Modal from "../components/ui/Modal.tsx";
import Input from "../components/ui/Input.tsx";
import Select from "../components/ui/Select.tsx";
import PeriodSelector from "../components/shared/PeriodSelector.tsx";
import EmptyState from "../components/ui/EmptyState.tsx";
import type { Budget } from "../hooks/useDashboard.ts";

function prevMonth(ym: string) { const [y,m]=ym.split("-").map(Number); const d=new Date(y,m-2,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function nextM(ym: string) { const [y,m]=ym.split("-").map(Number); const d=new Date(y,m,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }

function BudgetCard({ b }: { b: Budget }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-text-primary text-sm">
            {b.categoryIcon} {b.categoryName}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {formatCurrency(b.spent)} dépensés
          </p>
        </div>
        {alertBadge(b.alertLevel, b.pct)}
      </div>
      <ProgressBar value={b.pct} />
      <div className="flex justify-between text-xs text-text-tertiary mt-2">
        <span>Reste : {formatCurrency(b.remaining)}</span>
        <span>/ {formatCurrency(b.amount)}</span>
      </div>
    </Card>
  );
}

function BudgetForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ categoryId: "", amount: "", period: "monthly" });
  const { data: categories = [] } = useCategories();
  const create = useCreateBudget();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({...f, [k]: e.target.value}));
  const expCats = categories.filter(c => c.type === "expense");

  return (
    <Modal open={open} onClose={onClose} title="Nouveau budget">
      <form onSubmit={e => { e.preventDefault(); create.mutate({...form, amount: Math.round(parseFloat(form.amount)*100)}, {onSuccess: onClose}); }} className="space-y-4">
        <Select label="Catégorie" value={form.categoryId} onChange={set("categoryId")} options={[{value:"",label:"Sélectionner"},...expCats.map(c=>({value:c.id,label:`${c.icon} ${c.name}`}))]} required />
        <Input label="Plafond mensuel (MAD)" type="number" step="0.01" value={form.amount} onChange={set("amount")} required />
        {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={create.isPending} className="flex-1">Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [showForm, setShowForm] = useState(false);
  const { data: budgets = [] } = useBudgets(month);

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const alerts = budgets.filter(b => b.alertLevel !== "ok").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Budgets</h1>
        <div className="flex items-center gap-3">
          <PeriodSelector month={month} onPrev={() => setMonth(prevMonth(month))} onNext={() => setMonth(nextM(month))} />
          <Button onClick={() => setShowForm(true)}>+ Nouveau budget</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total budgété", value: formatCurrency(totalBudgeted) },
          { label: "Dépensé", value: formatCurrency(totalSpent) },
          { label: "Restant", value: formatCurrency(totalBudgeted - totalSpent) },
          { label: "En alerte", value: `${alerts} catégorie${alerts > 1 ? "s" : ""}` },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-mono text-text-primary">{s.value}</p>
          </Card>
        ))}
      </div>

      {budgets.length === 0 ? (
        <EmptyState emoji="◫" title="Aucun budget" description="Définissez des plafonds par catégorie pour mieux piloter vos dépenses." action={{label:"+ Nouveau budget",onClick:()=>setShowForm(true)}} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(b => <BudgetCard key={b.id} b={b} />)}
        </div>
      )}

      <BudgetForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
