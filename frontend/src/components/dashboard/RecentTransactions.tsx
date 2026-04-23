import { Link } from "react-router-dom";
import Card, { CardHeader } from "../ui/Card.tsx";
import AmountDisplay from "../shared/AmountDisplay.tsx";
import EmptyState from "../ui/EmptyState.tsx";

interface TxRow {
  id: string;
  title: string;
  amount: number;
  type: string;
  date: string;
  categoryName: string;
  categoryIcon: string;
}

export default function RecentTransactions({ transactions }: { transactions?: TxRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Transactions récentes"
        action={
          <Link to="/transactions" className="text-xs text-text-secondary hover:text-text-primary">
            Voir tout →
          </Link>
        }
      />
      {!transactions?.length ? (
        <EmptyState emoji="💸" title="Aucune transaction" description="Ajoutez votre première dépense." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-2.5">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: "#f0f0ee" }}
              >
                {tx.categoryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{tx.title}</p>
                <p className="text-xs text-text-tertiary">{tx.categoryName}</p>
              </div>
              <AmountDisplay
                cents={tx.amount}
                type={tx.type as "income" | "expense" | "transfer"}
                size="sm"
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
