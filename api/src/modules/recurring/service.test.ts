import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Tests sur la logique de calcul de la prochaine occurrence ──────────────────
// On extrait la fonction nextOccurrence pour la tester directement.

function nextOccurrence(date: string, frequency: string): string {
  const d = new Date(date);
  switch (frequency) {
    case "daily":   d.setDate(d.getDate() + 1);        break;
    case "weekly":  d.setDate(d.getDate() + 7);        break;
    case "monthly": d.setMonth(d.getMonth() + 1);      break;
    case "yearly":  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

describe("nextOccurrence — calcul de la prochaine date", () => {
  it("daily : + 1 jour", () => {
    expect(nextOccurrence("2026-04-23", "daily")).toBe("2026-04-24");
  });

  it("weekly : + 7 jours", () => {
    expect(nextOccurrence("2026-04-23", "weekly")).toBe("2026-04-30");
  });

  it("monthly : + 1 mois", () => {
    expect(nextOccurrence("2026-04-23", "monthly")).toBe("2026-05-23");
  });

  it("monthly : gère le passage d'année", () => {
    expect(nextOccurrence("2026-12-15", "monthly")).toBe("2027-01-15");
  });

  it("yearly : + 1 an", () => {
    expect(nextOccurrence("2026-04-23", "yearly")).toBe("2027-04-23");
  });

  it("yearly : gère les années bissextiles", () => {
    // 28 fév 2024 → 28 fév 2025 (2025 non bissextile)
    expect(nextOccurrence("2024-02-28", "yearly")).toBe("2025-02-28");
  });
});

describe("createRecurringSchema — validation Zod", () => {
  it("valide une règle mensuelle complète", async () => {
    const { createRecurringSchema } = await import("./schema.ts");
    const result = createRecurringSchema.safeParse({
      title: "Netflix",
      amount: 11900,
      type: "expense",
      accountId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      frequency: "monthly",
      nextDate: "2026-05-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejette une fréquence inconnue", async () => {
    const { createRecurringSchema } = await import("./schema.ts");
    const result = createRecurringSchema.safeParse({
      title: "Test",
      amount: 100,
      type: "expense",
      accountId: "00000000-0000-0000-0000-000000000001",
      categoryId: "00000000-0000-0000-0000-000000000002",
      frequency: "bimonthly",
      nextDate: "2026-05-01",
    });
    expect(result.success).toBe(false);
  });
});
