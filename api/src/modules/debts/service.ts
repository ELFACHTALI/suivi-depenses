import { db } from "../../db/index.ts";
import { debts } from "../../db/schema/index.ts";
import { eq, and, isNull } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateDebtInput } from "./schema.ts";

// ── Échéancier d'amortissement ─────────────────────────────────────────────────

export type AmortizationRow = {
  month: number;
  date: string;
  payment: number;   // centimes
  interest: number;  // centimes
  principal: number; // centimes
  balance: number;   // centimes
};

export function buildAmortizationSchedule(
  remainingAmount: number,
  monthlyPayment: number,
  annualRatePct: number,
  startDate: string
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = remainingAmount;
  const monthlyRate = annualRatePct / 100 / 12;
  let month = 1;
  const start = new Date(startDate);

  while (balance > 0 && month <= 360) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.min(monthlyPayment - interest, balance);
    const payment = Math.min(monthlyPayment, balance + interest);

    const date = new Date(start);
    date.setMonth(date.getMonth() + month - 1);

    schedule.push({
      month,
      date: date.toISOString().slice(0, 10),
      payment,
      interest,
      principal,
      balance: Math.max(0, balance - principal),
    });

    balance -= principal;
    if (balance <= 0) break;
    month++;
  }

  return schedule;
}

// ── Service ────────────────────────────────────────────────────────────────────

export async function listDebts(userId: string) {
  return db
    .select()
    .from(debts)
    .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)))
    .orderBy(debts.startDate);
}

export async function getDebt(userId: string, debtId: string) {
  const [debt] = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
    .limit(1);

  if (!debt) throw new AppError(404, "Dette introuvable");
  return debt;
}

export async function createDebt(userId: string, data: CreateDebtInput) {
  const [debt] = await db.insert(debts).values({ ...data, userId }).returning();
  return debt;
}

export async function updateDebt(
  userId: string,
  debtId: string,
  data: Partial<CreateDebtInput>
) {
  const [updated] = await db
    .update(debts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
    .returning();

  if (!updated) throw new AppError(404, "Dette introuvable");
  return updated;
}

export async function deleteDebt(userId: string, debtId: string) {
  const [deleted] = await db
    .update(debts)
    .set({ deletedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
    .returning({ id: debts.id });

  if (!deleted) throw new AppError(404, "Dette introuvable");
}

export async function getAmortizationSchedule(userId: string, debtId: string) {
  const debt = await getDebt(userId, debtId);
  return buildAmortizationSchedule(
    debt.remainingAmount,
    debt.monthlyPayment,
    Number(debt.interestRate),
    debt.startDate
  );
}
