import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilterPanel } from "./FilterPanel";
import { VisitFilters } from "../types";

const defaultFilters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "newest",
};

describe("FilterPanel Component", () => {
  beforeEach(() => {
    cleanup();
  });
  it("isOpenがfalseの場合、何もレンダリングしないこと", () => {
    const { container } = render(
      <FilterPanel
        isOpen={false}
        filters={defaultFilters}
        setFilters={vi.fn()}
        isFilterActive={false}
        onClearFilters={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("isOpenがtrueの場合、詳細フィルターパネルが表示されること", () => {
    render(
      <FilterPanel
        isOpen={true}
        filters={defaultFilters}
        setFilters={vi.fn()}
        isFilterActive={false}
        onClearFilters={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("region", { name: "詳細フィルター" })).toBeDefined();
    expect(screen.getByText("最低満足度")).toBeDefined();
    expect(screen.getByText("表示エリア")).toBeDefined();
  });

  it("最低満足度を変更すると setFilters が呼ばれること", () => {
    const setFilters = vi.fn();
    render(
      <FilterPanel
        isOpen={true}
        filters={defaultFilters}
        setFilters={setFilters}
        isFilterActive={false}
        onClearFilters={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "4" } });

    expect(setFilters).toHaveBeenCalled();
  });

  it("表示エリア内のみ表示ボタンを押すと filterByBounds が切り替わること", () => {
    const setFilters = vi.fn();
    render(
      <FilterPanel
        isOpen={true}
        filters={defaultFilters}
        setFilters={setFilters}
        isFilterActive={false}
        onClearFilters={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const button = screen.getByText(/地図の表示エリア内のみ表示/i);
    fireEvent.click(button);

    expect(setFilters).toHaveBeenCalled();
  });

  it("閉じるボタンを押すと onClose が呼出されること", () => {
    const onClose = vi.fn();
    render(
      <FilterPanel
        isOpen={true}
        filters={defaultFilters}
        setFilters={vi.fn()}
        isFilterActive={false}
        onClearFilters={vi.fn()}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole("button", { name: "詳細フィルターを閉じる" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
