import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { StatusTabs } from "./StatusTabs";
import { VisitFilters } from "../../types";

const defaultFilters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "recent",
};

afterEach(() => {
  cleanup();
});

describe("StatusTabs のアクセシビリティ", () => {
  const renderStatusTabs = (filters = defaultFilters, setFilters = vi.fn()) =>
    render(<StatusTabs filters={filters} setFilters={setFilters} />);

  it("ステータス絞り込みが tablist ではなくトグルボタン群として公開されること", () => {
    renderStatusTabs();

    // 対応する tabpanel が無いため tab ロールは使わない
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.getByRole("group", { name: "ステータスフィルター" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "すべて" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "行った" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "行きたい" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("ステータスボタンを押すと setFilters が呼ばれること", () => {
    const setFilters = vi.fn();
    renderStatusTabs(defaultFilters, setFilters);

    fireEvent.click(screen.getByRole("button", { name: "行った" }));

    expect(setFilters).toHaveBeenCalled();
  });
});
