import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AmountDisplay from "./AmountDisplay.tsx";

describe("AmountDisplay", () => {
  it("affiche le montant en MAD correctement", () => {
    render(<AmountDisplay cents={32000} type="expense" />);
    expect(screen.getByText(/320,00 MAD/)).toBeTruthy();
  });

  it("préfixe + pour income", () => {
    const { container } = render(<AmountDisplay cents={50000} type="income" />);
    expect(container.textContent).toContain("+");
  });

  it("préfixe - pour expense", () => {
    const { container } = render(<AmountDisplay cents={50000} type="expense" />);
    expect(container.textContent).toContain("-");
  });

  it("applique text-success pour income", () => {
    const { container } = render(<AmountDisplay cents={50000} type="income" />);
    expect(container.firstChild?.toString()).toBeTruthy();
    expect(container.querySelector("span")?.className).toContain("text-success");
  });

  it("applique text-danger pour expense", () => {
    const { container } = render(<AmountDisplay cents={50000} type="expense" />);
    expect(container.querySelector("span")?.className).toContain("text-danger");
  });

  it("gère une devise personnalisée", () => {
    render(<AmountDisplay cents={10000} type="income" currency="EUR" />);
    expect(screen.getByText(/EUR/)).toBeTruthy();
  });
});
