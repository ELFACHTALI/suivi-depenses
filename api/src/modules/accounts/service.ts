import { db } from "../../db/index.ts";
import { accounts, transactions } from "../../db/schema/index.ts";
import { eq, and, isNull, sql } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateAccountInput, UpdateAccountInput } from "./schema.ts";

// Solde calculé en temps réel :
//   initialBalance + Σ(income) - Σ(expense) + Σ(transfer signé)
const balanceExpr = sql<number>`
  ${accounts.initialBalance} + COALESCE(SUM(
    CASE
      WHEN ${transactions.type} = 'income'   THEN  ${transactions.amount}
      WHEN ${transactions.type} = 'expense'  THEN -${transactions.amount}
      WHEN ${transactions.type} = 'transfer' THEN  ${transactions.amount}
      ELSE 0
    END
  ), 0)`;

export async function listAccounts(userId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currency: accounts.currency,
      color: accounts.color,
      icon: accounts.icon,
      isArchived: accounts.isArchived,
      initialBalance: accounts.initialBalance,
      balance: balanceExpr,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .leftJoin(
      transactions,
      and(
        eq(transactions.accountId, accounts.id),
        isNull(transactions.deletedAt)
      )
    )
    .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
    .groupBy(accounts.id);
}

export async function getAccount(userId: string, accountId: string) {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currency: accounts.currency,
      color: accounts.color,
      icon: accounts.icon,
      isArchived: accounts.isArchived,
      initialBalance: accounts.initialBalance,
      balance: balanceExpr,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .leftJoin(
      transactions,
      and(
        eq(transactions.accountId, accounts.id),
        isNull(transactions.deletedAt)
      )
    )
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      )
    )
    .groupBy(accounts.id);

  if (!rows[0]) throw new AppError(404, "Compte introuvable");
  return rows[0];
}

export async function createAccount(userId: string, data: CreateAccountInput) {
  const [account] = await db
    .insert(accounts)
    .values({ ...data, userId })
    .returning();
  return account;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: UpdateAccountInput
) {
  const [updated] = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      )
    )
    .returning();

  if (!updated) throw new AppError(404, "Compte introuvable");
  return updated;
}

export async function deleteAccount(userId: string, accountId: string) {
  const [deleted] = await db
    .update(accounts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      )
    )
    .returning({ id: accounts.id });

  if (!deleted) throw new AppError(404, "Compte introuvable");
}
