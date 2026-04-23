import { useState } from "react";
import Modal from "../ui/Modal.tsx";
import Input from "../ui/Input.tsx";
import Select from "../ui/Select.tsx";
import Button from "../ui/Button.tsx";
import { useAccounts, useCategories, useCreateTransaction } from "../../hooks/useDashboard.ts";

interface Props { open: boolean; onClose: () => void; }

export default function TransactionForm({ open, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    accountId: "",
    categoryId: "",
    toAccountId: "",
    date: today,
    note: "",
    fiscalMarker: false,
  });

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const create = useCreateTransaction();

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const filteredCategories = categories.filter(
    (c) => form.type === "transfer" || c.type === (form.type === "expense" ? "expense" : "income")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        ...form,
        amount: Math.round(parseFloat(form.amount) * 100), // MAD → centimes
        ...(form.type !== "transfer" ? { toAccountId: undefined } : {}),
      },
      {
        onSuccess: () => {
          setForm({ title: "", amount: "", type: "expense", accountId: "", categoryId: "", toAccountId: "", date: today, note: "", fiscalMarker: false });
          onClose();
        },
      }
    );
  };

  const accountOptions = [
    { value: "", label: "Sélectionner un compte" },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];
  const categoryOptions = [
    { value: "", label: "Sélectionner une catégorie" },
    ...filteredCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-1 bg-surface-secondary rounded-sm p-0.5">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={`py-1.5 text-xs font-medium rounded-sm transition-colors ${
                form.type === t ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
              }`}
            >
              {t === "expense" ? "Dépense" : t === "income" ? "Revenu" : "Virement"}
            </button>
          ))}
        </div>

        <Input label="Libellé" value={form.title} onChange={set("title")} required autoFocus />
        <Input label={`Montant (${accounts[0]?.currency ?? "MAD"})`} type="number" step="0.01" min="0.01" value={form.amount} onChange={set("amount")} required />
        <Select label="Compte" value={form.accountId} onChange={set("accountId")} options={accountOptions} required />
        {form.type === "transfer" && (
          <Select label="Compte destination" value={form.toAccountId} onChange={set("toAccountId")} options={accountOptions} required />
        )}
        <Select label="Catégorie" value={form.categoryId} onChange={set("categoryId")} options={categoryOptions} required />
        <Input label="Date" type="date" value={form.date} onChange={set("date")} max={today} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">Note (optionnel)</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="w-full rounded-sm border border-surface-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
            rows={2}
          />
        </div>
        {form.type === "expense" && (
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={form.fiscalMarker} onChange={(e) => setForm((f) => ({ ...f, fiscalMarker: e.target.checked }))} />
            Marquer comme charge fiscale
          </label>
        )}
        {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={create.isPending} className="flex-1">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  );
}
