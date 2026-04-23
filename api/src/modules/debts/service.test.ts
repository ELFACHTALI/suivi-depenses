import { describe, it, expect } from "vitest";
import { buildAmortizationSchedule } from "./service.ts";

describe("buildAmortizationSchedule — amortissement mensuel", () => {
  it("génère le bon nombre d'échéances pour un prêt simple", () => {
    // 100 000 MAD à 5% sur 12 mois → mensualité ~8 560 MAD
    const schedule = buildAmortizationSchedule(
      10_000_000, // 100 000 MAD en centimes
      856_000,    // ~8 560 MAD/mois en centimes
      5,
      "2026-01-01"
    );
    expect(schedule.length).toBe(12);
  });

  it("le solde final est nul ou quasi nul", () => {
    const schedule = buildAmortizationSchedule(
      5_000_000,
      450_000,
      6,
      "2026-01-01"
    );
    const last = schedule[schedule.length - 1];
    expect(last.balance).toBe(0);
  });

  it("la mensualité = intérêts + principal", () => {
    const schedule = buildAmortizationSchedule(
      2_000_000,
      200_000,
      12,
      "2026-01-01"
    );
    schedule.forEach((row) => {
      expect(row.payment).toBe(row.interest + row.principal);
    });
  });

  it("les intérêts décroissent au fil des mois", () => {
    const schedule = buildAmortizationSchedule(
      3_000_000,
      250_000,
      8,
      "2026-01-01"
    );
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interest).toBeLessThanOrEqual(schedule[i - 1].interest);
    }
  });

  it("avec taux 0% : tout le paiement va au principal", () => {
    const schedule = buildAmortizationSchedule(
      1_000_000,
      200_000,
      0,
      "2026-01-01"
    );
    schedule.forEach((row) => {
      expect(row.interest).toBe(0);
      expect(row.principal).toBe(row.payment);
    });
  });

  it("les dates sont incrémentées mois par mois", () => {
    const schedule = buildAmortizationSchedule(
      500_000,
      100_000,
      0,
      "2026-03-01"
    );
    expect(schedule[0].date).toBe("2026-03-01");
    expect(schedule[1].date).toBe("2026-04-01");
    expect(schedule[2].date).toBe("2026-05-01");
  });
});
