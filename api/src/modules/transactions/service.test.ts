import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Drizzle DB ────────────────────────────────────────────────────────────
vi.mock("../../db/index.ts", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// ── Tests des règles métier (sans vraie DB) ────────────────────────────────────

import { createTransactionSchema, updateTransactionSchema } from "./schema.ts";

describe("RG-01 — Validation des transactions", () => {
  const validBase = {
    title: "Carrefour",
    amount: 32000, // 320.00 MAD en centimes
    type: "expense" as const,
    accountId: "00000000-0000-0000-0000-000000000001",
    categoryId: "00000000-0000-0000-0000-000000000002",
    date: new Date().toISOString().slice(0, 10),
  };

  it("accepte une transaction valide", () => {
    const result = createTransactionSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejette un titre vide", () => {
    const result = createTransactionSchema.safeParse({ ...validBase, title: "" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.title).toBeDefined();
  });

  it("rejette un montant nul", () => {
    const result = createTransactionSchema.safeParse({ ...validBase, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejette un montant négatif", () => {
    const result = createTransactionSchema.safeParse({ ...validBase, amount: -100 });
    expect(result.success).toBe(false);
  });

  it("rejette une date dans le futur", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const result = createTransactionSchema.safeParse({ ...validBase, date: tomorrow });
    expect(result.success).toBe(false);
  });

  it("accepte une date d'aujourd'hui", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = createTransactionSchema.safeParse({ ...validBase, date: today });
    expect(result.success).toBe(true);
  });

  it("rejette un UUID de compte invalide", () => {
    const result = createTransactionSchema.safeParse({ ...validBase, accountId: "pas-un-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("RG-02 — Virements", () => {
  const validTransfer = {
    title: "Virement épargne",
    amount: 100000,
    type: "transfer" as const,
    accountId: "00000000-0000-0000-0000-000000000001",
    categoryId: "00000000-0000-0000-0000-000000000002",
    date: new Date().toISOString().slice(0, 10),
    toAccountId: "00000000-0000-0000-0000-000000000003",
  };

  it("accepte un virement avec toAccountId", () => {
    const result = createTransactionSchema.safeParse(validTransfer);
    expect(result.success).toBe(true);
  });

  it("rejette un virement sans toAccountId", () => {
    const { toAccountId: _, ...noTo } = validTransfer;
    const result = createTransactionSchema.safeParse(noTo);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.toAccountId).toBeDefined();
  });
});

describe("RG-01 — Mise à jour de transaction", () => {
  it("accepte une mise à jour partielle", () => {
    const result = updateTransactionSchema.safeParse({ title: "Nouveau titre" });
    expect(result.success).toBe(true);
  });

  it("rejette un montant nul en mise à jour", () => {
    const result = updateTransactionSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejette une date future en mise à jour", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const result = updateTransactionSchema.safeParse({ date: tomorrow });
    expect(result.success).toBe(false);
  });
});
