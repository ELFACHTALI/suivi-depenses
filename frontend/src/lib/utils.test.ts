import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatRelativeDate,
  pct,
  initials,
  currentMonth,
  signedAmount,
} from "./utils.ts";

describe("formatCurrency", () => {
  it("formate 32000 centimes en '320,00 MAD'", () => {
    expect(formatCurrency(32000, "MAD")).toBe("320,00 MAD");
  });

  it("formate 0 correctement", () => {
    expect(formatCurrency(0)).toBe("0,00 MAD");
  });

  it("formate des centimes sans arrondi", () => {
    expect(formatCurrency(100)).toBe("1,00 MAD");
    expect(formatCurrency(150)).toBe("1,50 MAD");
  });

  it("gère une devise personnalisée", () => {
    expect(formatCurrency(10000, "EUR")).toContain("EUR");
  });
});

describe("formatRelativeDate", () => {
  it("retourne 'Aujourd'hui' pour la date du jour", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatRelativeDate(today)).toBe("Aujourd'hui");
  });

  it("retourne 'Hier' pour hier", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    expect(formatRelativeDate(yesterday)).toBe("Hier");
  });

  it("retourne une date courte pour les jours anciens", () => {
    const old = "2026-01-15";
    const result = formatRelativeDate(old);
    expect(result).not.toBe("Aujourd'hui");
    expect(result).not.toBe("Hier");
    expect(result).toMatch(/\d+/);
  });
});

describe("pct", () => {
  it("calcule 50% correctement", () => {
    expect(pct(50, 100)).toBe(50);
  });

  it("retourne 0 si total est 0", () => {
    expect(pct(10, 0)).toBe(0);
  });

  it("arrondit à 1 décimale", () => {
    expect(pct(1, 3)).toBe(33.3);
  });

  it("peut dépasser 100%", () => {
    expect(pct(120, 100)).toBe(120);
  });
});

describe("initials", () => {
  it("extrait les initiales d'un nom complet", () => {
    expect(initials("Karim Alaoui")).toBe("KA");
  });

  it("gère un nom simple", () => {
    expect(initials("Marie")).toBe("M");
  });

  it("ne prend que les 2 premiers mots", () => {
    expect(initials("Jean Pierre Martin")).toBe("JP");
  });
});

describe("currentMonth", () => {
  it("retourne le format YYYY-MM", () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("correspond au mois en cours", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
  });
});

describe("signedAmount", () => {
  it("préfixe '+' pour un revenu", () => {
    expect(signedAmount(100000, "income")).toContain("+");
  });

  it("préfixe '-' pour une dépense", () => {
    expect(signedAmount(100000, "expense")).toContain("-");
  });
});
