import { db } from "../../db/index.ts";
import { recurringRules, transactions } from "../../db/schema/index.ts";
import { eq, and, isNull, lte } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateRecurringInput } from "./schema.ts";

function nextOccurrence(date: string, frequency: string): string {
  const d = new Date(date);
  switch (frequency) {
    case "daily":   d.setDate(d.getDate() + 1);    break;
    case "weekly":  d.setDate(d.getDate() + 7);    break;
    case "monthly": d.setMonth(d.getMonth() + 1);  break;
    case "yearly":  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

export async function listRecurring(userId: string) {
  return db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.userId, userId), isNull(recurringRules.deletedAt)))
    .orderBy(recurringRules.nextDate);
}

export async function createRecurring(userId: string, data: CreateRecurringInput) {
  const [rule] = await db.insert(recurringRules).values({ ...data, userId }).returning();
  return rule;
}

export async function updateRecurring(
  userId: string,
  ruleId: string,
  data: Partial<CreateRecurringInput>
) {
  const [updated] = await db
    .update(recurringRules)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId), isNull(recurringRules.deletedAt))
    )
    .returning();

  if (!updated) throw new AppError(404, "Règle récurrente introuvable");
  return updated;
}

export async function deleteRecurring(userId: string, ruleId: string) {
  const [deleted] = await db
    .update(recurringRules)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId), isNull(recurringRules.deletedAt))
    )
    .returning({ id: recurringRules.id });

  if (!deleted) throw new AppError(404, "Règle récurrente introuvable");
}

// Appelé par le job BullMQ quotidien (RG-23)
export async function generateDueTransactions(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const due = await db
    .select()
    .from(recurringRules)
    .where(and(isNull(recurringRules.deletedAt), lte(recurringRules.nextDate, today)));

  let generated = 0;

  for (const rule of due) {
    if (rule.endDate && rule.nextDate > rule.endDate) continue;

    await db.insert(transactions).values({
      userId: rule.userId,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      title: rule.title,
      amount: rule.amount,
      currency: rule.currency,
      type: rule.type,
      date: rule.nextDate,
      isRecurring: true,
      recurringRuleId: rule.id,
    });

    await db
      .update(recurringRules)
      .set({
        nextDate: nextOccurrence(rule.nextDate, rule.frequency),
        lastGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(recurringRules.id, rule.id));

    generated++;
  }

  return generated;
}
