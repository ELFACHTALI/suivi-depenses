import { db } from "../../db/index.ts";
import { transactions, accounts } from "../../db/schema/index.ts";
import {
  eq,
  and,
  isNull,
  gte,
  lte,
  like,
  sql,
  between,
} from "drizzle-orm";
import { randomUUID } from "crypto";
import { AppError } from "../../middleware/errorHandler.ts";
import { monthToDateRange } from "../../schemas/common.ts";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionsQuery,
} from "./schema.ts";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function assertAccountBelongsToUser(userId: string, accountId: string) {
  const rows = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      )
    )
    .limit(1);

  if (!rows[0]) throw new AppError(404, `Compte ${accountId} introuvable`);
}

// RG-18 : déduplication — même compte + montant (±1 centime) + date (±1 jour)
async function findDuplicate(
  userId: string,
  accountId: string,
  amount: number,
  date: string
) {
  const d = new Date(date);
  const dayBefore = new Date(d.getTime() - 86_400_000).toISOString().slice(0, 10);
  const dayAfter = new Date(d.getTime() + 86_400_000).toISOString().slice(0, 10);

  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.accountId, accountId),
        isNull(transactions.deletedAt),
        between(transactions.date, dayBefore, dayAfter),
        between(
          transactions.amount,
          sql`${amount - 1}`,
          sql`${amount + 1}`
        )
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

// ── Service public ─────────────────────────────────────────────────────────────

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const { month, from, to, type, categoryId, accountId, search, page, limit } = query;

  const conditions = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];

  // Filtre par période
  if (month) {
    const range = monthToDateRange(month);
    conditions.push(between(transactions.date, range.from, range.to));
  } else {
    if (from) conditions.push(gte(transactions.date, from));
    if (to) conditions.push(lte(transactions.date, to));
  }

  if (type === "recurring") {
    conditions.push(eq(transactions.isRecurring, true));
  } else if (type) {
    conditions.push(eq(transactions.type, type));
  }

  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (search) conditions.push(like(transactions.title, `%${search}%`));

  const offset = (page - 1) * limit;

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(sql`${transactions.date} DESC, ${transactions.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}

export async function getTransaction(userId: string, txId: string) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .limit(1);

  if (!tx) throw new AppError(404, "Transaction introuvable");
  return tx;
}

export async function createTransaction(userId: string, data: CreateTransactionInput) {
  await assertAccountBelongsToUser(userId, data.accountId);

  // RG-18 : vérification doublon (sauf virements)
  if (data.type !== "transfer") {
    const dup = await findDuplicate(userId, data.accountId, data.amount, data.date);
    if (dup) {
      throw new AppError(
        409,
        `Transaction potentiellement dupliquée (id: ${dup.id}). Vérifiez avant de continuer.`
      );
    }
  }

  // RG-02 : virement → deux transactions liées, montant signé
  if (data.type === "transfer") {
    await assertAccountBelongsToUser(userId, data.toAccountId!);
    const transferId = randomUUID();

    const [source, dest] = await db
      .insert(transactions)
      .values([
        {
          userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          title: data.title,
          amount: -data.amount, // débit sur le compte source
          currency: data.currency,
          fxRate: data.fxRate,
          type: "transfer",
          transferId,
          date: data.date,
          note: data.note,
          fiscalMarker: false,
        },
        {
          userId,
          accountId: data.toAccountId!,
          categoryId: data.categoryId,
          title: data.title,
          amount: data.amount, // crédit sur le compte destination
          currency: data.currency,
          fxRate: data.fxRate,
          type: "transfer",
          transferId,
          date: data.date,
          note: data.note,
          fiscalMarker: false,
        },
      ])
      .returning();

    return { source, dest };
  }

  const [tx] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      fxRate: data.fxRate,
      type: data.type,
      date: data.date,
      note: data.note,
      fiscalMarker: data.fiscalMarker,
    })
    .returning();

  return tx;
}

export async function updateTransaction(
  userId: string,
  txId: string,
  data: UpdateTransactionInput
) {
  // Impossible de modifier un côté d'un virement (RG-02)
  const [existing] = await db
    .select({ transferId: transactions.transferId })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .limit(1);

  if (!existing) throw new AppError(404, "Transaction introuvable");
  if (existing.transferId) {
    throw new AppError(400, "Impossible de modifier un virement. Supprimez-le et recréez-le.");
  }

  const [updated] = await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(transactions.id, txId))
    .returning();

  return updated;
}

export async function deleteTransaction(userId: string, txId: string) {
  const [existing] = await db
    .select({ transferId: transactions.transferId })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .limit(1);

  if (!existing) throw new AppError(404, "Transaction introuvable");

  if (existing.transferId) {
    // Supprimer les deux côtés du virement (soft-delete)
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.transferId, existing.transferId));
  } else {
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.id, txId));
  }
}
