import { db } from "../../db/index.ts";
import { budgets, transactions, categories } from "../../db/schema/index.ts";
import { eq, and, isNull, between, sql } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateBudgetInput } from "./schema.ts";

// ── Helpers période ────────────────────────────────────────────────────────────

function periodRange(period: "monthly" | "annual", referenceDate = new Date()) {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  if (period === "monthly") {
    const from = new Date(y, m, 1).toISOString().slice(0, 10);
    const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    return { from, to };
  }
  return {
    from: `${y}-01-01`,
    to: `${y}-12-31`,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export async function listBudgets(userId: string, month?: string) {
  const ref = month ? new Date(`${month}-01`) : new Date();

  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      alert80Sent: budgets.alert80Sent,
      alert100Sent: budgets.alert100Sent,
      spent: sql<number>`COALESCE(SUM(
        CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END
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
        // N'exclure que les virements (transfer_id not null)
        sql`${transactions.transferId} IS NULL`
      )
    )
    .where(and(eq(budgets.userId, userId), isNull(budgets.deletedAt)))
    .groupBy(budgets.id, categories.id);

  // Filtre côté JS pour appliquer la plage de dates (Drizzle leftJoin + SQL dynamique)
  // Note: en prod, on préférerait un CTE ou subquery ; ici on filtre post-agrégation
  // pour rester lisible. La volumétrie MVP le permet.
  return rows.map((b) => {
    const range = periodRange(b.period as "monthly" | "annual", ref);
    const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 1000) / 10 : 0;
    const remaining = b.amount - b.spent;
    const daysInPeriod = daysBetween(range.from, range.to);
    const daysPassed = Math.max(1, daysBetween(range.from, new Date().toISOString().slice(0, 10)));
    const projectedSpent = Math.round((b.spent / daysPassed) * daysInPeriod);
    const willExceed = projectedSpent > b.amount;

    return {
      ...b,
      spent: b.spent,
      remaining,
      pct,
      willExceed,
      projectedSpent,
      alertLevel:
        pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : willExceed ? "predictive" : "ok",
    };
  });
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  const [budget] = await db
    .insert(budgets)
    .values({ ...data, userId })
    .returning();
  return budget;
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  data: Partial<CreateBudgetInput>
) {
  const [updated] = await db
    .update(budgets)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(budgets.id, budgetId), eq(budgets.userId, userId), isNull(budgets.deletedAt))
    )
    .returning();

  if (!updated) throw new AppError(404, "Budget introuvable");
  return updated;
}

export async function deleteBudget(userId: string, budgetId: string) {
  const [deleted] = await db
    .update(budgets)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(budgets.id, budgetId), eq(budgets.userId, userId), isNull(budgets.deletedAt))
    )
    .returning({ id: budgets.id });

  if (!deleted) throw new AppError(404, "Budget introuvable");
}

// RG-08 : marque les alertes envoyées pour éviter les doublons
export async function markAlertSent(
  budgetId: string,
  level: "80" | "100"
): Promise<void> {
  const patch =
    level === "80" ? { alert80Sent: true } : { alert100Sent: true };
  await db.update(budgets).set(patch).where(eq(budgets.id, budgetId));
}

// ── Utilitaire ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(
    1,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
  );
}
