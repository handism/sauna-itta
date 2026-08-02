import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { QuickFilterChips } from "./QuickFilterChips";
import type { SaunaVisit, VisitFilters } from "../types";

const filters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "recent",
};

const visits: SaunaVisit[] = [
  {
    id: "1",
    name: "サウナA",
    lat: 35,
    lng: 139,
    area: "東京",
    date: "2026-07-01",
    comment: "",
    rating: 5,
    tags: ["外気浴", "水風呂"],
    status: "visited",
  },
  {
    id: "2",
    name: "サウナB",
    lat: 36,
    lng: 140,
    area: "神奈川",
    date: "2026-07-02",
    comment: "",
    rating: 4,
    tags: ["ロウリュ"],
    status: "visited",
  },
];

describe("QuickFilterChips", () => {
  // vitest の globals を有効にしていないため自動クリーンアップは働かない
  afterEach(() => {
    cleanup();
  });

  it("横スクロールが必要な候補数では視覚的なスワイプヒントを表示すること", () => {
    render(
      <QuickFilterChips
        filters={filters}
        setFilters={vi.fn()}
        visits={visits}
      />
    );

    expect(screen.getByText("横にスワイプ")).toBeInTheDocument();
  });

  it("検索文字列やステータス絞り込みがある場合、アクティブフィルターチップとして表示されクリックでクリアできること", () => {
    const setFilters = vi.fn();
    const activeFilters: VisitFilters = {
      ...filters,
      search: "東京",
      status: "visited",
    };

    render(
      <QuickFilterChips
        filters={activeFilters}
        setFilters={setFilters}
        visits={visits}
        activeFilterCount={2}
      />
    );

    expect(screen.getByText('検索: "東京"')).toBeInTheDocument();
    expect(screen.getByText("ステータス: 行った")).toBeInTheDocument();
  });

  // setFilters には更新関数が渡るため、現在のフィルターへ適用した結果で検証する
  function applyLastSetFilters(
    setFilters: ReturnType<typeof vi.fn>,
    base: VisitFilters,
  ): VisitFilters {
    const updater = setFilters.mock.lastCall?.[0] as (prev: VisitFilters) => VisitFilters;
    return updater(base);
  }

  it.each([
    ['検索: "東京"', { search: "東京" }, "search", ""],
    ["ステータス: 行った", { status: "visited" as const }, "status", "all"],
    ["★ 3.0以上", { minRating: 3 }, "minRating", 0],
    ["エリア: 北海道", { selectedArea: "北海道" }, "selectedArea", ""],
    ["タグ: 薬草", { selectedTag: "薬草" }, "selectedTag", ""],
    ["エリア内のみ", { filterByBounds: true }, "filterByBounds", false],
  ] as const)("アクティブチップ「%s」を押すとその条件だけ外す", (label, patch, key, cleared) => {
    const setFilters = vi.fn();
    const activeFilters: VisitFilters = { ...filters, ...patch };
    render(
      <QuickFilterChips filters={activeFilters} setFilters={setFilters} visits={visits} />
    );

    fireEvent.click(screen.getByRole("button", { name: new RegExp(escapeRegExp(label)) }));

    expect(applyLastSetFilters(setFilters, activeFilters)[key]).toBe(cleared);
  });

  // 人気エリアは extractPrefecture を通すため、都道府県名まで入った area が必要
  const prefectureVisits: SaunaVisit[] = visits.map((visit, index) => ({
    ...visit,
    area: index === 0 ? "東京都渋谷区" : "神奈川県横浜市",
  }));

  it("人気エリア・人気タグはプリセットのため専用チップを重複表示しない", () => {
    render(
      <QuickFilterChips
        filters={{ ...filters, selectedArea: "東京都", selectedTag: "外気浴" }}
        setFilters={vi.fn()}
        visits={prefectureVisits}
      />
    );

    expect(screen.queryByText("エリア: 東京都")).not.toBeInTheDocument();
    expect(screen.queryByText("タグ: 外気浴")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "東京都" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "外気浴" })).toHaveAttribute("aria-pressed", "true");
  });

  it("★4.0以上のプリセットは押すたびに絞り込みを入れ外しする", () => {
    const setFilters = vi.fn();
    const { rerender } = render(
      <QuickFilterChips filters={filters} setFilters={setFilters} visits={visits} />
    );

    fireEvent.click(screen.getByRole("button", { name: "4.0以上" }));
    expect(applyLastSetFilters(setFilters, filters).minRating).toBe(4);

    const applied: VisitFilters = { ...filters, minRating: 4 };
    rerender(
      <QuickFilterChips filters={applied} setFilters={setFilters} visits={visits} />
    );
    fireEvent.click(screen.getByRole("button", { name: "4.0以上" }));
    expect(applyLastSetFilters(setFilters, applied).minRating).toBe(0);
  });

  it("エリア・タグのプリセットも再度押すと解除する", () => {
    const setFilters = vi.fn();
    const applied: VisitFilters = { ...filters, selectedArea: "東京都", selectedTag: "外気浴" };
    render(
      <QuickFilterChips filters={applied} setFilters={setFilters} visits={prefectureVisits} />
    );

    fireEvent.click(screen.getByRole("button", { name: "東京都" }));
    expect(applyLastSetFilters(setFilters, applied).selectedArea).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "外気浴" }));
    expect(applyLastSetFilters(setFilters, applied).selectedTag).toBe("");
  });

  it("★4.0以上は専用チップではなくプリセット側の押下状態で表す", () => {
    render(
      <QuickFilterChips
        filters={{ ...filters, minRating: 4 }}
        setFilters={vi.fn()}
        visits={visits}
      />
    );

    expect(screen.queryByText("★ 4.0以上")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4.0以上" })).toHaveAttribute("aria-pressed", "true");
  });

  it("有効な条件があるときだけ件数つきクリアボタンを出す", () => {
    const onClearFilters = vi.fn();
    const { rerender } = render(
      <QuickFilterChips
        filters={filters}
        setFilters={vi.fn()}
        visits={visits}
        activeFilterCount={0}
        onClearFilters={onClearFilters}
      />
    );
    expect(screen.queryByRole("button", { name: /クリア/ })).not.toBeInTheDocument();

    rerender(
      <QuickFilterChips
        filters={{ ...filters, search: "東京" }}
        setFilters={vi.fn()}
        visits={visits}
        activeFilterCount={2}
        onClearFilters={onClearFilters}
      />
    );
    const clearButton = screen.getByRole("button", { name: /クリア/ });
    expect(clearButton).toHaveTextContent("2");

    fireEvent.click(clearButton);
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it("候補が少なければスワイプヒントを出さない", () => {
    render(<QuickFilterChips filters={filters} setFilters={vi.fn()} visits={[]} />);

    expect(screen.queryByText("横にスワイプ")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "サブフィルター" })).toBeInTheDocument();
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

