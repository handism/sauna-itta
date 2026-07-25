import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ReactNode } from "react";
import { VisitListSearch } from "./VisitListSearch";
import { SaunaMapProvider } from "../context";
import { VisitFilters } from "../types";

const defaultFilters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "recent",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <SaunaMapProvider>{children}</SaunaMapProvider>
);

beforeEach(() => {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    writable: true,
    value: {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(),
    },
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("VisitListSearch のアクセシビリティ", () => {
  const renderSearch = (setFilters = vi.fn()) =>
    render(
      <VisitListSearch filters={defaultFilters} setFilters={setFilters} visits={[]} />,
      { wrapper }
    );

  it("検索欄が placeholder ではなくラベルで参照できること", () => {
    renderSearch();

    const input = screen.getByLabelText("サウナ名・エリア・タグで検索");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("ステータス絞り込みが tablist ではなくトグルボタン群として公開されること", () => {
    renderSearch();

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
    expect(screen.getByRole("button", { name: "イキタイ" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("ステータスボタンを押すと setFilters が呼ばれること", () => {
    const setFilters = vi.fn();
    renderSearch(setFilters);

    fireEvent.click(screen.getByRole("button", { name: "行った" }));

    expect(setFilters).toHaveBeenCalled();
  });
});
