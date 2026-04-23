import { db } from "../../db/index.ts";
import { goals, users } from "../../db/schema/index.ts";
import { eq, and, isNull, ne, sql } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateGoalInput } from "./schema.ts";

const FREE_GOAL_LIMIT = 3;

// ── Projection date ─────────────────────────────────────────────────────────────

function projectCompletionDate(
  currentAmount: number,
  targetAmount: number,
  createdAt: Date
): string | null {
  if (currentAmount <= 0) return null;
  const monthsElapsed = Math.max(
    1,
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const avgMonthlyRate = currentAmount / monthsElapsed;
  if (avgMonthlyRate <= 0) return null;

  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return null;

  const monthsNeeded = remaining / avgMonthlyRate;
  const projected = new Date();
  projected.setMonth(projected.getMonth() + Math.ceil(monthsNeeded));
  return projected.toISOString().slice(0, 10);
}

// ── Service ────────────────────────────────────────────────────────────────────

export async function listGoals(userId: string) {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), isNull(goals.deletedAt)))
    .orderBy(goals.createdAt);

  return rows.map((g) => ({
    ...g,
    pct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 1000) / 10 : 0,
    remaining: g.targetAmount - g.currentAmount,
    projectedCompletionDate: projectCompletionDate(
      g.currentAmount,
      g.targetAmount,
      g.createdAt
    ),
  }));
}

export async function getGoal(userId: string, goalId: string) {
  const [g] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .limit(1);

  if (!g) throw new AppError(404, "Objectif introuvable");
  return {
    ...g,
    pct: Math.round((g.currentAmount / g.targetAmount) * 1000) / 10,
    remaining: g.targetAmount - g.currentAmount,
    projectedCompletionDate: projectCompletionDate(g.currentAmount, g.targetAmount, g.createdAt),
  };
}

export async function createGoal(userId: string, data: CreateGoalInput) {
  // Gate freemium : max 3 objectifs actifs pour plan free
  const [user] = await db
    .select({ planType: users.planType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.planType === "free") {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          isNull(goals.deletedAt),
          ne(goals.status, "archived")
        )
      );

    if (Number(count) >= FREE_GOAL_LIMIT) {
      throw new AppError(
        403,
        `Le plan gratuit est limité à ${FREE_GOAL_LIMIT} objectifs actifs. Passez à Premium pour en créer davantage.`
      );
    }
  }

  const [goal] = await db.insert(goals).values({ ...data, userId }).returning();
  return goal;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: Partial<CreateGoalInput & { status: "in_progress" | "achieved" | "archived" }>
) {
  const [updated] = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .returning();

  if (!updated) throw new AppError(404, "Objectif introuvable");
  return updated;
}

export async function contributeToGoal(userId: string, goalId: string, amount: number) {
  const [g] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .limit(1);

  if (!g) throw new AppError(404, "Objectif introuvable");

  const newAmount = g.currentAmount + amount;
  const isAchieved = newAmount >= g.targetAmount;

  const [updated] = await db
    .update(goals)
    .set({
      currentAmount: newAmount,
      status: isAchieved ? "achieved" : g.status,
      updatedAt: new Date(),
    })
    .where(eq(goals.id, goalId))
    .returning();

  return { ...updated, justAchieved: isAchieved && g.status !== "achieved" };
}

export async function deleteGoal(userId: string, goalId: string) {
  const [deleted] = await db
    .update(goals)
    .set({ deletedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .returning({ id: goals.id });

  if (!deleted) throw new AppError(404, "Objectif introuvable");
}
