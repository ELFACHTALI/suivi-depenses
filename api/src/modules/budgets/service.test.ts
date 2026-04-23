import { describe, it, expect } from "vitest";
import { createBudgetSchema } from "./schema.ts";

describe("createBudgetSchema — validation", () => {
  it("accepte un budget mensuel valide", () => {
    const result = createBudgetSchema.safeParse({
      categoryId: "00000000-0000-0000-0000-000000000001",
      amount: 150000,
      period: "monthly",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un montant nul", () => {
    const result = createBudgetSchema.safeParse({
      categoryId: "00000000-0000-0000-0000-000000000001",
      amount: 0,
      period: "monthly",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un UUID invalide", () => {
    const result = createBudgetSchema.safeParse({
      categoryId: "pas-un-uuid",
      amount: 100000,
    });
    expect(result.success).toBe(false);
  });

  it("applique les valeurs par défaut (period=monthly, startDate=1er du mois)", () => {
    const result = createBudgetSchema.safeParse({
      categoryId: "00000000-0000-0000-0000-000000000001",
      amount: 50000,
    });
    expect(result.success).toBe(true);
    expect(result.data?.period).toBe("monthly");
    expect(result.data?.startDate).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe("alertLevel logic — logique de calcul des alertes (RG-08)", () => {
  function alertLevel(spent: number, amount: number): string {
    const pct = amount > 0 ? (spent / amount) * 100 : 0;
    if (pct >= 100) return "exceeded";
    if (pct >= 80) return "warning";
    return "ok";
  }

  it("ok si moins de 80%", () => {
    expect(alertLevel(60000, 100000)).toBe("ok");
  });

  it("warning à 80%", () => {
    expect(alertLevel(80000, 100000)).toBe("warning");
  });

  it("warning entre 80% et 100%", () => {
    expect(alertLevel(95000, 100000)).toBe("warning");
  });

  it("exceeded à 100%", () => {
    expect(alertLevel(100000, 100000)).toBe("exceeded");
  });

  it("exceeded au-delà de 100% (dépassement)", () => {
    expect(alertLevel(115000, 100000)).toBe("exceeded");
  });
});
