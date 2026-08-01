import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ShareModalView, type ShareModalViewProps } from "./ShareModal";
import type { SaunaVisit, VisitStats } from "../types";

const stats: VisitStats = {
  total: 2,
  avgRating: 4.5,
  firstDate: "2026-01-05",
  lastDate: "2026-08-02",
  visitedCount: 2,
  wishlistCount: 0,
  uniqueAreas: 1,
  prefectures: ["東京都"],
  prefectureCount: 1,
};

function makeVisit(index: number): SaunaVisit {
  return {
    id: `sauna-${index}`,
    name: `サウナ${index}`,
    lat: 35,
    lng: 139,
    date: "2026-08-02",
    comment: "",
    status: "visited",
  };
}

function renderShare(overrides: Partial<ShareModalViewProps> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <ShareModalView
      isOpen
      stats={stats}
      filteredVisits={[makeVisit(1), makeVisit(2)]}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onClose, ...utils };
}

describe("ShareModalView", () => {
  afterEach(() => {
    cleanup();
  });

  it("閉じているときは何も描画しない", () => {
    renderShare({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("見出しと説明をdialogへ関連づける", () => {
    renderShare();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("サウナイッタ シェアビュー");
    expect(dialog).toHaveAccessibleDescription(/スクリーンショット/);
  });

  it("記録期間と平均満足度を表示する", () => {
    renderShare();

    const summary = screen.getByText(/記録期間/);
    expect(within(summary).getByText("2026-01-05")).toBeInTheDocument();
    expect(within(summary).getByText("2026-08-02")).toBeInTheDocument();
    expect(screen.getByText(/平均満足度/)).toHaveTextContent("4.5");
  });

  it("平均満足度が0のときは表示しない", () => {
    renderShare({ stats: { ...stats, avgRating: 0 } });

    expect(screen.queryByText(/平均満足度/)).not.toBeInTheDocument();
  });

  it("30件までを描画し、超過分は件数で伝える", () => {
    const visits = Array.from({ length: 42 }, (_, index) => makeVisit(index + 1));
    const { container } = renderShare({ filteredVisits: visits });

    expect(container.querySelectorAll(".share-item")).toHaveLength(30);
    expect(screen.getByText("ほか 12 件…")).toBeInTheDocument();
  });

  it("ちょうど30件のときは超過表示を出さない", () => {
    const visits = Array.from({ length: 30 }, (_, index) => makeVisit(index + 1));
    renderShare({ filteredVisits: visits });

    expect(screen.queryByText(/ほか/)).not.toBeInTheDocument();
  });

  it("閉じるボタン・オーバーレイ・Escapeで閉じ、本体クリックでは閉じない", () => {
    const { onClose, container } = renderShare();

    fireEvent.click(container.querySelector(".share-modal")!);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector(".share-overlay")!);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
