import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProgressBar from "./ProgressBar.tsx";

describe("ProgressBar", () => {
  it("applique bg-success si valeur < 80%", () => {
    const { container } = render(<ProgressBar value={50} />);
    const fill = container.querySelector("div > div");
    expect(fill?.className).toContain("bg-success");
  });

  it("applique bg-warning entre 80% et 99%", () => {
    const { container } = render(<ProgressBar value={85} />);
    const fill = container.querySelector("div > div");
    expect(fill?.className).toContain("bg-warning");
  });

  it("applique bg-danger à 100%+", () => {
    const { container } = render(<ProgressBar value={115} />);
    const fill = container.querySelector("div > div");
    expect(fill?.className).toContain("bg-danger");
  });

  it("clamp à 100% pour le style width", () => {
    const { container } = render(<ProgressBar value={150} />);
    const fill = container.querySelector("div > div") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("respecte un variant forcé", () => {
    const { container } = render(<ProgressBar value={150} variant="success" />);
    const fill = container.querySelector("div > div");
    expect(fill?.className).toContain("bg-success");
  });
});
