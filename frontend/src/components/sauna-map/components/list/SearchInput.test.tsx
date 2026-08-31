import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SearchInput } from "./SearchInput";
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

describe("SearchInput のアクセシビリティ", () => {
  const renderSearchInput = (filters = defaultFilters, setFilters = vi.fn()) =>
    render(<SearchInput filters={filters} setFilters={setFilters} />);

  it("検索欄が placeholder ではなくラベルで参照できること", () => {
    renderSearchInput();

    const input = screen.getByLabelText("サウナ名・エリア・タグで検索");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("入力すると setFilters が呼ばれること", () => {
    const setFilters = vi.fn();
    renderSearchInput(defaultFilters, setFilters);

    const input = screen.getByLabelText("サウナ名・エリア・タグで検索");
    fireEvent.change(input, { target: { value: "サウナ" } });

    expect(setFilters).toHaveBeenCalled();
  });

  it("検索文字列がある場合、クリアボタンが表示され、クリックでクリアされること", () => {
    const setFilters = vi.fn();
    renderSearchInput({ ...defaultFilters, search: "サウナ" }, setFilters);

    const clearButton = screen.getByRole("button", { name: "検索のクリア" });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(setFilters).toHaveBeenCalled();
  });
});
