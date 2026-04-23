import { useState } from "react";
import { useTransactions, useDeleteTransaction, useCategories, useAccounts } from "../hooks/useDashboard.ts";
import { currentMonth, formatRelativeDate, formatCurrency } from "../lib/utils.ts";
import Button from "../components/ui/Button.tsx";
import Badge from "../components/ui/Badge.tsx";
import AmountDisplay from "../components/shared/AmountDisplay.tsx";
import TransactionForm from "../components/transactions/TransactionForm.tsx";
import EmptyState from "../components/ui/EmptyState.tsx";
import Spinner from "../components/ui/Spinner.tsx";
import { api } from "../lib/api.ts";

type Filter = "all" | "expense" | "income" | "recurring";

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(currentMonth());

  const params: Record<string, string> = { month };
  if (filter !== "all") params.type = filter;
  if (search) params.search = search;

  const { data: txs = [], isLoading } = useTransactions(params);
  const { data: categories = [] } = useCategories();
  const deleteTx = useDeleteTransaction();

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Grouper par date
  const grouped = txs.reduce<Record<string, typeof txs>>((acc, tx) => {
    const key = formatRelativeDate(tx.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const exportCsv = () => {
    const rows = [
      ["Date", "Libellé", "Type", "Catégorie", "Montant (MAD)"],
      ...txs.map((tx) => [
        tx.date,
        tx.title,
        tx.type,
        catMap[tx.categoryId]?.name ?? "",
        (tx.amount / 100).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `fintrack-${month}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>↓ Exporter CSV</Button>
          <Button onClick={() => setShowForm(true)}>+ Nouvelle transaction</Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher…"
          className="border border-surface-border rounded-sm px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {(["all", "expense", "income", "recurring"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === f
                ? "bg-accent text-white border-accent"
                : "border-surface-border text-text-secondary hover:border-accent"
            }`}
          >
            {{ all: "Tout", expense: "Dépenses", income: "Revenus", recurring: "Abonnements" }[f]}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : txs.length === 0 ? (
        <EmptyState
          emoji="💸"
          title="Aucune transaction"
          description="Commencez à enregistrer vos dépenses et revenus."
          action={{ label: "+ Nouvelle transaction", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="bg-white border border-surface-border rounded-lg divide-y divide-surface-border">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="px-5 py-2 bg-surface-secondary">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{dateLabel}</p>
              </div>
              {items.map((tx) => {
                const cat = catMap[tx.categoryId];
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-secondary/50 group">
                    <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg bg-surface-secondary shrink-0">
                      {cat?.icon ?? "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{tx.title}</p>
                      <p className="text-xs text-text-tertiary">{cat?.name} · {tx.date}</p>
                    </div>
                    {tx.isRecurring && <Badge variant="neutral" className="text-[10px]">↻</Badge>}
                    {tx.fiscalMarker && <Badge variant="info" className="text-[10px]">fiscal</Badge>}
                    <AmountDisplay cents={tx.amount} type={tx.type as any} size="sm" />
                    <button
                      onClick={() => deleteTx.mutate(tx.id)}
                      className="text-text-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <TransactionForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
