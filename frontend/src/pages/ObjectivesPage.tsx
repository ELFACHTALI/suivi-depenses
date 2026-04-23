import { useState } from "react";
import { useGoals, useDebts, useCreateGoal, useContributeToGoal } from "../hooks/useDashboard.ts";
import { formatCurrency, formatDate } from "../lib/utils.ts";
import Card from "../components/ui/Card.tsx";
import ProgressBar from "../components/ui/ProgressBar.tsx";
import Button from "../components/ui/Button.tsx";
import Badge from "../components/ui/Badge.tsx";
import Modal from "../components/ui/Modal.tsx";
import Input from "../components/ui/Input.tsx";
import EmptyState from "../components/ui/EmptyState.tsx";
import type { Goal, Debt } from "../hooks/useDashboard.ts";

function statusBadge(status: string) {
  if (status === "achieved") return <Badge variant="success">Atteint ✓</Badge>;
  if (status === "archived") return <Badge variant="neutral">Archivé</Badge>;
  return <Badge variant="info">En cours</Badge>;
}

function GoalCard({ g, onContribute }: { g: Goal; onContribute: (id: string) => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl mb-1">{g.emoji}</p>
          <p className="font-semibold text-text-primary">{g.name}</p>
          {g.description && <p className="text-xs text-text-tertiary mt-0.5">{g.description}</p>}
        </div>
        {statusBadge(g.status)}
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-mono font-semibold text-text-primary">{formatCurrency(g.currentAmount, g.currency)}</span>
          <span className="text-text-tertiary font-mono">{formatCurrency(g.targetAmount, g.currency)}</span>
        </div>
        <ProgressBar value={g.pct} variant={g.status === "achieved" ? "success" : undefined} />
      </div>
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>Reste : {formatCurrency(g.remaining, g.currency)}</span>
        {g.projectedCompletionDate && (
          <span>Prévu : {formatDate(g.projectedCompletionDate)}</span>
        )}
      </div>
      {g.status === "in_progress" && (
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onContribute(g.id)}>
          + Alimenter
        </Button>
      )}
    </Card>
  );
}

function DebtCard({ d }: { d: Debt }) {
  const pct = Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100);
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl mb-1">🏦</p>
          <p className="font-semibold text-text-primary">{d.creditor}</p>
          <p className="text-xs text-text-tertiary">{d.interestRate}% / an</p>
        </div>
        <Badge variant="danger">Dette</Badge>
      </div>
      <p className="text-xl font-mono font-semibold text-danger mb-3">
        -{formatCurrency(d.remainingAmount, d.currency)} restants
      </p>
      <ProgressBar value={pct} variant="success" />
      <p className="text-xs text-text-tertiary mt-2">{pct}% remboursé · {formatCurrency(d.monthlyPayment, d.currency)}/mois</p>
    </Card>
  );
}

function ContributeModal({ goalId, onClose }: { goalId: string; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const contribute = useContributeToGoal();
  return (
    <Modal open={!!goalId} onClose={onClose} title="Alimenter l'objectif">
      <form onSubmit={e => { e.preventDefault(); contribute.mutate({id: goalId, amount: Math.round(parseFloat(amount)*100)}, {onSuccess: onClose}); }} className="space-y-4">
        <Input label="Montant (MAD)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
        {contribute.error && <p className="text-sm text-danger">{contribute.error.message}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={contribute.isPending} className="flex-1">Confirmer</Button>
        </div>
      </form>
    </Modal>
  );
}

function GoalForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", targetAmount: "", emoji: "🎯", targetDate: "" });
  const create = useCreateGoal();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, [k]: e.target.value}));
  return (
    <Modal open={open} onClose={onClose} title="Nouvel objectif">
      <form onSubmit={e => { e.preventDefault(); create.mutate({...form, targetAmount: Math.round(parseFloat(form.targetAmount)*100), targetDate: form.targetDate || undefined}, {onSuccess: onClose}); }} className="space-y-4">
        <div className="flex gap-2">
          <Input label="Emoji" value={form.emoji} onChange={set("emoji")} className="w-20" />
          <Input label="Nom de l'objectif" value={form.name} onChange={set("name")} required className="flex-1" />
        </div>
        <Input label="Montant cible (MAD)" type="number" step="0.01" value={form.targetAmount} onChange={set("targetAmount")} required />
        <Input label="Date cible (optionnel)" type="date" value={form.targetDate} onChange={set("targetDate")} />
        {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={create.isPending} className="flex-1">Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ObjectivesPage() {
  const { data: goals = [] } = useGoals();
  const { data: debts = [] } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [contributeId, setContributeId] = useState("");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Objectifs & Dettes</h1>
        <Button onClick={() => setShowForm(true)}>+ Nouvel objectif</Button>
      </div>

      {goals.length === 0 && debts.length === 0 ? (
        <EmptyState emoji="◎" title="Aucun objectif" description="Définissez vos objectifs d'épargne ou suivez vos dettes." action={{label:"+ Nouvel objectif",onClick:()=>setShowForm(true)}} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(g => <GoalCard key={g.id} g={g} onContribute={setContributeId} />)}
          {debts.map(d => <DebtCard key={d.id} d={d} />)}
        </div>
      )}

      <GoalForm open={showForm} onClose={() => setShowForm(false)} />
      {contributeId && <ContributeModal goalId={contributeId} onClose={() => setContributeId("")} />}
    </div>
  );
}
