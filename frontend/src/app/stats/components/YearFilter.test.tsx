import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { YearFilter } from "./YearFilter";

afterEach(() => {
  cleanup();
});

describe("YearFilter", () => {
  it("全期間と年ごとの切り替えを group + aria-pressed で公開する", () => {
    render(<YearFilter years={["2026", "2025"]} year="2025" onChange={vi.fn()} />);

    const group = screen.getByRole("group", { name: "集計する期間" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "すべて" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "2025年" })).toHaveAttribute("aria-pressed", "true");
  });

  it("押した年を通知し、「すべて」は null を通知する", () => {
    const onChange = vi.fn();
    render(<YearFilter years={["2026", "2025"]} year={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2026年" }));
    expect(onChange).toHaveBeenLastCalledWith("2026");

    fireEvent.click(screen.getByRole("button", { name: "すべて" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("年が 1 つしか無いときは描画しない", () => {
    const { container } = render(<YearFilter years={["2026"]} year={null} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
