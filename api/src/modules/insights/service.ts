import { db } from "../../db/index.ts";
import {
  transactions,
  budgets,
  debts,
  insights,
  categories,
  recurringRules,
} from "../../db/schema/index.ts";
import { eq, and, isNull, sql, between, desc } from "drizzle-orm";

// ── Score santé financière (RG-13) ────────────────────────────────────────────

export async function computeHealthScore(userId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  // Sous-métrique 1 : taux d'épargne (poids 30%)
  const [totals] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='income' THEN ${transactions.amount} ELSE 0 END),0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='expense' THEN ${transactions.amount} ELSE 0 END),0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNull(transactions.transferId),
        between(transactions.date, thirtyDaysAgo, today)
      )
    );

  const savingsRateScore =
    totals.income > 0
      ? Math.min(100, Math.max(0, ((totals.income - totals.expenses) / totals.income) * 333))
      : 0;

  // Sous-métrique 2 : respect des budgets (poids 30%)
  const allBudgets = await db
    .select({ id: budgets.id, amount: budgets.amount, categoryId: budgets.categoryId })
    .from(budgets)
    .where(and(eq(budgets.userId, userId), isNull(budgets.deletedAt)));

  let budgetScore = 100;
  if (allBudgets.length > 0) {
    let ok = 0;
    for (const b of allBudgets) {
      const [{ spent }] = await db
        .select({ spent: sql<number>`COALESCE(SUM(${transactions.amount}),0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, b.categoryId),
            eq(transactions.type, "expense"),
            isNull(transactions.deletedAt),
            between(transactions.date, thirtyDaysAgo, today)
          )
        );
      if (spent <= b.amount) ok++;
    }
    budgetScore = Math.round((ok / allBudgets.length) * 100);
  }

  // Sous-métrique 3 : régularité de saisie (poids 20%) — jours avec au moins 1 transaction
  const [{ days }] = await db
    .select({ days: sql<number>`COUNT(DISTINCT ${transactions.date})` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        between(transactions.date, thirtyDaysAgo, today)
      )
    );
  const regularityScore = Math.min(100, Math.round((Number(days) / 30) * 100));

  // Sous-métrique 4 : ratio dette/revenu (poids 20%) — plus c'est bas, mieux c'est
  const [{ totalDebt }] = await db
    .select({ totalDebt: sql<number>`COALESCE(SUM(${debts.remainingAmount}),0)` })
    .from(debts)
    .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)));

  const debtRatioScore =
    totals.income > 0
      ? Math.max(0, 100 - Math.min(100, (Number(totalDebt) / (totals.income * 12)) * 100))
      : 100;

  const score = Math.round(
    savingsRateScore * 0.3 +
    budgetScore * 0.3 +
    regularityScore * 0.2 +
    debtRatioScore * 0.2
  );

  // Persiste le score (RG-13 : chaque lundi)
  const weekStart = getMonday(now).toISOString().slice(0, 10);
  await db
    .insert(insights)
    .values({
      userId,
      weekStart,
      score,
      savingsRate: String(savingsRateScore),
      budgetRespect: String(budgetScore),
      entryRegularity: String(regularityScore),
      debtRatio: String(debtRatioScore),
      tips: generateTips({ savingsRateScore, budgetScore, regularityScore }),
    })
    .onConflictDoNothing(); // idempotent si déjà calculé cette semaine

  return score;
}

// ── Anomalies ──────────────────────────────────────────────────────────────────

export async function detectAnomalies(userId: string) {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const d120 = new Date(now.getTime() - 120 * 86_400_000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  // Dépenses par catégorie sur les 30 derniers jours
  const recentByCategory = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      spent: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        isNull(transactions.deletedAt),
        between(transactions.date, d30, today)
      )
    )
    .groupBy(transactions.categoryId, categories.name);

  // Moyenne des 90 jours précédents (divisée par 3 pour mensualiser)
  const historicalByCategory = await db
    .select({
      categoryId: transactions.categoryId,
      avgMonthly: sql<number>`SUM(${transactions.amount}) / 3.0`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        isNull(transactions.deletedAt),
        between(transactions.date, d120, d30)
      )
    )
    .groupBy(transactions.categoryId);

  const histMap = new Map(historicalByCategory.map((r) => [r.categoryId, r.avgMonthly]));

  return recentByCategory
    .filter((r) => {
      const avg = histMap.get(r.categoryId) ?? 0;
      return avg > 0 && r.spent > avg * 2;
    })
    .map((r) => ({
      categoryName: r.categoryName,
      spent: r.spent,
      avgMonthly: histMap.get(r.categoryId)!,
      ratio: Math.round((r.spent / histMap.get(r.categoryId)!) * 10) / 10,
    }));
}

// ── Abonnements détectés (RG-20) ──────────────────────────────────────────────

export async function detectSubscriptions(userId: string) {
  // Retourne les règles récurrentes existantes + transactions régulières détectées
  const rules = await db
    .select({
      id: recurringRules.id,
      title: recurringRules.title,
      amount: recurringRules.amount,
      frequency: recurringRules.frequency,
      nextDate: recurringRules.nextDate,
    })
    .from(recurringRules)
    .where(and(eq(recurringRules.userId, userId), isNull(recurringRules.deletedAt)));

  return rules;
}

// ── Lecture du dernier score ───────────────────────────────────────────────────

export async function getLatestInsight(userId: string) {
  const [insight] = await db
    .select()
    .from(insights)
    .where(eq(insights.userId, userId))
    .orderBy(desc(insights.createdAt))
    .limit(1);
  return insight ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function generateTips(scores: {
  savingsRateScore: number;
  budgetScore: number;
  regularityScore: number;
}): string[] {
  const tips: string[] = [];
  if (scores.savingsRateScore < 30)
    tips.push("Votre taux d'épargne est faible. Essayez de réduire vos dépenses discrétionnaires.");
  if (scores.budgetScore < 70)
    tips.push("Plusieurs budgets sont dépassés ce mois-ci. Revoyez vos plafonds ou vos habitudes.");
  if (scores.regularityScore < 50)
    tips.push("Saisissez vos dépenses plus régulièrement pour un suivi précis.");
  if (tips.length === 0)
    tips.push("Excellente gestion ! Continuez sur cette lancée.");
  return tips;
}
