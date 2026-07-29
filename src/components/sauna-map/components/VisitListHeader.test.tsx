import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitListHeader } from "./VisitListHeader";

afterEach(() => {
  cleanup();
});

describe("VisitListHeader", () => {
  it("行きたい記録も含む一覧として汎用的な見出しを表示すること", () => {
    render(
      <VisitListHeader filteredCount={3} viewMode="compact" onViewModeChange={vi.fn()} />
    );

    expect(screen.getByRole("heading", { name: "サウナ一覧 (3件)" })).toBeInTheDocument();
  });

  it("表示形式トグルが aria-pressed で選択状態を公開すること", () => {
    render(
      <VisitListHeader
        filteredCount={3}
        viewMode="compact"
        onViewModeChange={vi.fn()}
      />
    );

    expect(screen.getByRole("group", { name: "表示形式切り替え" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "リスト表示に切り替え" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "カード表示に切り替え" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("絞り込み結果の件数がライブリージョンで読み上げられること", () => {
    const { rerender } = render(
      <VisitListHeader filteredCount={12} viewMode="compact" onViewModeChange={vi.fn()} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("12件のサウナを表示中");
    expect(status).toHaveAttribute("aria-live", "polite");

    rerender(
      <VisitListHeader filteredCount={3} viewMode="compact" onViewModeChange={vi.fn()} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("3件のサウナを表示中");
  });

  it("表示形式を切り替えると onViewModeChange が呼ばれること", () => {
    const onViewModeChange = vi.fn();
    render(
      <VisitListHeader
        filteredCount={0}
        viewMode="compact"
        onViewModeChange={onViewModeChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "カード表示に切り替え" }));

    expect(onViewModeChange).toHaveBeenCalledWith("card");
  });
});
