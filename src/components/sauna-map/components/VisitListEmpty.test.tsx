import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitListEmpty } from "./VisitListEmpty";

describe("VisitListEmpty", () => {
  const onClearFilters = vi.fn();
  const onStartNewVisit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a registration CTA on first run", () => {
    render(
      <VisitListEmpty
        hasVisits={false}
        isFilterActive={false}
        onClearFilters={onClearFilters}
        onStartNewVisit={onStartNewVisit}
      />
    );

    const cta = screen.getByRole("button", { name: "最初のサウナを登録する" });
    fireEvent.click(cta);

    expect(onStartNewVisit).toHaveBeenCalledTimes(1);
    expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
  });

  it("omits the CTA when no handler is provided", () => {
    render(
      <VisitListEmpty
        hasVisits={false}
        isFilterActive={false}
        onClearFilters={onClearFilters}
      />
    );

    expect(
      screen.queryByRole("button", { name: "最初のサウナを登録する" })
    ).not.toBeInTheDocument();
  });

  it("shows the filter reset button when filters hide every visit", () => {
    render(
      <VisitListEmpty
        hasVisits
        isFilterActive
        onClearFilters={onClearFilters}
        onStartNewVisit={onStartNewVisit}
      />
    );

    // 登録済みの状態では初回向け CTA は出さない
    expect(
      screen.queryByRole("button", { name: "最初のサウナを登録する" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "フィルターをクリア" }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("explains the map bounds filter when it is enabled", () => {
    render(
      <VisitListEmpty
        hasVisits
        filterByBounds
        isFilterActive={false}
        onClearFilters={onClearFilters}
      />
    );

    expect(screen.getByText(/現在の地図エリア内に該当するサウナ/)).toBeInTheDocument();
  });
});
