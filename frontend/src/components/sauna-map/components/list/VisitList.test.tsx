import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitListView, INITIAL_RENDER_COUNT, CHUNK_SIZE } from "./VisitList";
import { SaunaVisit, VisitFilters } from "../../types";

// 検索欄は UIProvider を要求するが、ここでの検証対象は描画件数なのでスタブする
vi.mock("./VisitListSearch", () => ({
  VisitListSearch: () => <div data-testid="visit-list-search" />,
}));

const makeVisit = (index: number): SaunaVisit => ({
  id: `visit-${index}`,
  name: `サウナ ${index}`,
  lat: 35.68,
  lng: 139.76,
  date: "2026-07-25",
  rating: 5,
  comment: "",
  tags: [],
  image: "",
  status: "visited",
  area: "東京",
  visitCount: 1,
});

const defaultFilters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  sort: "recent",
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  mapBounds: null,
};

describe("VisitListView の増分レンダリング", () => {
  const baseProps = {
    filters: defaultFilters,
    setFilters: vi.fn(),
    isFilterActive: false,
    activeFilterCount: 0,
    onClearFilters: vi.fn(),
    onStartNewVisit: vi.fn(),
    onEdit: vi.fn(),
    selectedId: null,
    onSelectVisit: vi.fn(),
    onDeselectVisit: vi.fn(),
    hoveredId: null,
    onHoverVisit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // この環境の jsdom は localStorage / IntersectionObserver を持たないため差し替える
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const countRenderedItems = () =>
    document.querySelectorAll("[data-visit-id]").length;

  it("renders every visit when the list is short", () => {
    const visits = Array.from({ length: 5 }, (_, i) => makeVisit(i));
    render(
      <VisitListView {...baseProps} visits={visits} filteredVisits={visits} />
    );

    expect(countRenderedItems()).toBe(5);
    expect(screen.queryByRole("button", { name: /さらに表示/ })).not.toBeInTheDocument();
  });

  it("caps the initial render and offers a load-more button", () => {
    const visits = Array.from({ length: INITIAL_RENDER_COUNT + 25 }, (_, i) => makeVisit(i));
    render(
      <VisitListView {...baseProps} visits={visits} filteredVisits={visits} />
    );

    expect(countRenderedItems()).toBe(INITIAL_RENDER_COUNT);
    expect(screen.getByRole("button", { name: "さらに表示（残り 25 件）" })).toBeInTheDocument();
  });

  it("renders the next chunk when the load-more button is pressed", () => {
    const total = INITIAL_RENDER_COUNT + CHUNK_SIZE + 10;
    const visits = Array.from({ length: total }, (_, i) => makeVisit(i));
    render(
      <VisitListView {...baseProps} visits={visits} filteredVisits={visits} />
    );

    fireEvent.click(screen.getByRole("button", { name: /さらに表示/ }));

    expect(countRenderedItems()).toBe(INITIAL_RENDER_COUNT + CHUNK_SIZE);
  });

  it("expands far enough to reveal a selected visit beyond the initial window", () => {
    const visits = Array.from({ length: 200 }, (_, i) => makeVisit(i));
    const targetIndex = 150;

    render(
      <VisitListView
        {...baseProps}
        visits={visits}
        filteredVisits={visits}
        selectedId={`visit-${targetIndex}`}
      />
    );

    expect(countRenderedItems()).toBe(targetIndex + 1);
    expect(
      document.querySelector(`[data-visit-id="visit-${targetIndex}"]`)
    ).not.toBeNull();
  });
});
