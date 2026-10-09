import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilterPanel } from "./FilterPanel";
import { SaunaVisit, VisitFilters } from "../../types";

const defaultFilters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "recent",
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

    const select = screen.getByRole("combobox", { name: "最低満足度" });
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

  it("最低満足度がラベルから参照でき、表示エリアがグループとして公開されること", () => {
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

    expect(screen.getByLabelText("最低満足度")).toBe(screen.getByRole("combobox", { name: "最低満足度" }));
    expect(screen.getByRole("group", { name: "表示エリア" })).toBeDefined();
    expect(
      screen
        .getByText(/地図の表示エリア内のみ表示/i)
        .closest("button")
        ?.getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("地域とタグを全候補から選び、他の条件を保持する", () => {
    const setFilters = vi.fn();
    const visits: SaunaVisit[] = [
      { id: "1", name: "サウナ", lat: 35, lng: 139, area: "東京都台東区",
        date: "2026-10-01", comment: "", rating: 4, tags: ["外気浴", "ロウリュ"] },
      { id: "2", name: "別のサウナ", lat: 43, lng: 141, area: "北海道札幌市",
        date: "2026-10-02", comment: "", rating: 5, tags: ["水風呂"] },
    ];
    const filters = { ...defaultFilters, minRating: 4, search: "サウナ" };
    render(<FilterPanel isOpen visits={visits} filters={filters} setFilters={setFilters}
      isFilterActive onClearFilters={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("option", { name: "北海道" })).toBeDefined();
    expect(screen.getByRole("option", { name: "水風呂" })).toBeDefined();
    fireEvent.change(screen.getByRole("combobox", { name: "地域" }), { target: { value: "北海道" } });
    expect(setFilters.mock.lastCall?.[0](filters)).toEqual({ ...filters, selectedArea: "北海道" });
    fireEvent.change(screen.getByRole("combobox", { name: "タグ" }), { target: { value: "水風呂" } });
    expect(setFilters.mock.lastCall?.[0](filters)).toEqual({ ...filters, selectedTag: "水風呂" });
    fireEvent.change(screen.getByRole("combobox", { name: "タグ" }), { target: { value: "" } });
    expect(setFilters.mock.lastCall?.[0]({ ...filters, selectedTag: "水風呂" })).toEqual(filters);
  });

  it("候補から消えた選択済みの地域・タグも保持する", () => {
    render(<FilterPanel isOpen filters={{ ...defaultFilters, selectedArea: "北海道", selectedTag: "薬草" }}
      setFilters={vi.fn()} isFilterActive onClearFilters={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByLabelText("地域") as HTMLSelectElement).value).toBe("北海道");
    expect((screen.getByLabelText("タグ") as HTMLSelectElement).value).toBe("薬草");
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
