import { db } from "../../db/index.ts";
import { accounts, transactions, budgets, categories, insights } from "../../db/schema/index.ts";
import { eq, and, isNull, sql, desc, between } from "drizzle-orm";
import { monthToDateRange } from "../../schemas/common.ts";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getDashboard(userId: string, month?: string) {
  const targetMonth = month ?? currentMonth();
  const range = monthToDateRange(targetMonth);
  const prevRange = monthToDateRange(prevMonth(targetMonth));

  // ── 1. Solde net de tous les comptes actifs ──────────────────────────────────
  const [{ netBalance }] = await db
    .select({
      netBalance: sql<number>`
        SUM(${accounts.initialBalance} + COALESCE((
          SELECT SUM(
            CASE
              WHEN t.type = 'income'   THEN  t.amount
              WHEN t.type = 'expense'  THEN -t.amount
              WHEN t.type = 'transfer' THEN  t.amount
              ELSE 0
            END
          )
          FROM transactions t
          WHERE t.account_id = ${accounts.id}
            AND t.deleted_at IS NULL
        ), 0))`,
    })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), isNull(accounts.deletedAt), sql`${accounts.isArchived} = false`)
    );

  // ── 2. Revenus & dépenses du mois courant ────────────────────────────────────
  const [monthly] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNull(transactions.transferId),
        between(transactions.date, range.from, range.to)
      )
    );

  // ── 3. Mois précédent (pour le % d'évolution) ────────────────────────────────
  const [prev] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNull(transactions.transferId),
        between(transactions.date, prevRange.from, prevRange.to)
      )
    );

  const savingsRate =
    monthly.income > 0
      ? Math.round(((monthly.income - monthly.expenses) / monthly.income) * 1000) / 10
      : 0;

  const incomeChange = prev.income > 0
    ? Math.round(((monthly.income - prev.income) / prev.income) * 1000) / 10
    : null;
  const expensesChange = prev.expenses > 0
    ? Math.round(((monthly.expenses - prev.expenses) / prev.expenses) * 1000) / 10
    : null;

  // ── 4. Transactions récentes (5 dernières) ───────────────────────────────────
  const recentTransactions = await db
    .select({
      id: transactions.id,
      title: transactions.title,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNull(transactions.transferId)
      )
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(5);

  // ── 5. Top 4 budgets du mois ─────────────────────────────────────────────────
  const topBudgets = await db
    .select({
      id: budgets.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      amount: budgets.amount,
      spent: sql<number>`COALESCE(SUM(
        CASE WHEN ${transactions.type} = 'expense' AND ${transactions.transferId} IS NULL
          THEN ${transactions.amount} ELSE 0 END
      ), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .leftJoin(
      transactions,
      and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, budgets.categoryId),
        isNull(transactions.deletedAt),
        between(transactions.date, range.from, range.to)
      )
    )
    .where(and(eq(budgets.userId, userId), isNull(budgets.deletedAt)))
    .groupBy(budgets.id, categories.id)
    .orderBy(sql`spent DESC`)
    .limit(4);

  // ── 6. Cash flow 6 derniers mois ────────────────────────────────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const fromDate = sixMonthsAgo.toISOString().slice(0, 10);

  const rawCashFlow = await db
    .select({
      monthKey: sql<string>`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNull(transactions.transferId),
        sql`${transactions.date} >= ${fromDate}`
      )
    )
    .groupBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM') ASC`);

  // Remplir les mois manquants avec des zéros
  const cashFlowMap = Object.fromEntries(rawCashFlow.map((r) => [r.monthKey, r]));
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const cashFlow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixMonthsAgo);
    d.setMonth(sixMonthsAgo.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: fmt.format(d),
      income: Number(cashFlowMap[key]?.income ?? 0),
      expenses: Number(cashFlowMap[key]?.expenses ?? 0),
    };
  });

  // ── 7. Dernier score santé ───────────────────────────────────────────────────
  const [latestInsight] = await db
    .select({ score: insights.score, weekStart: insights.weekStart, tips: insights.tips })
    .from(insights)
    .where(eq(insights.userId, userId))
    .orderBy(desc(insights.createdAt))
    .limit(1);

  return {
    period: targetMonth,
    netBalance,
    cashFlow,
    monthly: {
      income: monthly.income,
      expenses: monthly.expenses,
      savingsRate,
      incomeChange,
      expensesChange,
    },
    recentTransactions,
    topBudgets: topBudgets.map((b) => ({
      ...b,
      pct: b.amount > 0 ? Math.round((b.spent / b.amount) * 1000) / 10 : 0,
    })),
    healthScore: latestInsight ?? null,
  };
}
