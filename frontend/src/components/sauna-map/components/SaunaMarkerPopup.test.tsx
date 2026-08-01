import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SaunaMarkerPopup } from "./SaunaMarkerPopup";
import { SaunaVisit } from "../types";

const visit: SaunaVisit = {
  id: "sauna-1",
  name: "天空サウナ",
  area: "東京都渋谷区",
  lat: 35.6895,
  lng: 139.6917,
  date: "2026-07-24",
  comment: "最高のととのい",
  rating: 5,
  status: "visited",
  history: [
    { date: "2026-06-01", comment: "1回目", rating: 4, image: "" },
    { date: "2026-07-24", comment: "最高のととのい", rating: 5, image: "" },
  ],
};

describe("SaunaMarkerPopup", () => {
  afterEach(cleanup);

  it("施設名・エリア・満足度・訪問回数を表示する", () => {
    render(<SaunaMarkerPopup visit={visit} isWishlist={false} onEdit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /天空サウナ/ })).toBeInTheDocument();
    expect(screen.getByText("東京都渋谷区")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "満足度: 5/5" })).toBeInTheDocument();
    // history が 2 件なので 2 回目と表示する（visitCount 未設定でも履歴から導出する）
    expect(screen.getByText("・2回目")).toBeInTheDocument();
    expect(screen.queryByText("行きたい")).not.toBeInTheDocument();
  });

  it("行きたい記録には行きたいチップを出す", () => {
    render(<SaunaMarkerPopup visit={{ ...visit, status: "wishlist" }} isWishlist onEdit={vi.fn()} />);

    expect(screen.getByText("行きたい")).toBeInTheDocument();
  });

  it("経路リンクは新しいタブへ安全に開く", () => {
    render(<SaunaMarkerPopup visit={visit} isWishlist={false} onEdit={vi.fn()} />);

    const link = screen.getByRole("link", { name: /ここへ行く/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.getAttribute("href")).toContain("35.6895");
  });

  it("編集ボタンは対象の記録を渡して呼び出す", () => {
    const onEdit = vi.fn();
    render(<SaunaMarkerPopup visit={visit} isWishlist={false} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "編集する" }));

    expect(onEdit).toHaveBeenCalledWith(visit);
  });

  it("data URL の写真は表示し、危険なURLは表示しない", () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const { rerender } = render(
      <SaunaMarkerPopup visit={{ ...visit, image: dataUrl }} isWishlist={false} onEdit={vi.fn()} />,
    );
    expect(screen.getByRole("img", { name: "天空サウナ" })).toBeInTheDocument();

    rerender(
      <SaunaMarkerPopup
        visit={{ ...visit, image: "javascript:alert(1)" }}
        isWishlist={false}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img", { name: "天空サウナ" })).not.toBeInTheDocument();
  });
});
