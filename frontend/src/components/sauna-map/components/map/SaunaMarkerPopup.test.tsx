import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SaunaMarkerPopup } from "./SaunaMarkerPopup";
import { SaunaVisit } from "../../types";

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
    expect(screen.getByText("訪問 2回目")).toBeInTheDocument();
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

    // 一覧カードと同じく、どの記録の編集かを名前に含める
    fireEvent.click(screen.getByRole("button", { name: "天空サウナの記録を編集" }));

    expect(onEdit).toHaveBeenCalledWith(visit);
  });

  it("data URL の写真は表示し、危険なURLは表示しない", () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const { rerender } = render(
      <SaunaMarkerPopup visit={{ ...visit, image: dataUrl }} isWishlist={false} onEdit={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "天空サウナの写真を拡大表示" })).toBeInTheDocument();

    rerender(
      <SaunaMarkerPopup
        visit={{ ...visit, image: "javascript:alert(1)" }}
        isWishlist={false}
        onEdit={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "天空サウナの写真を拡大表示" })).not.toBeInTheDocument();
  });

  it("「また行った」は再訪として、編集は通常の編集として開く", () => {
    const onEdit = vi.fn();
    render(<SaunaMarkerPopup visit={visit} isWishlist={false} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "天空サウナにまた行った記録をつける" }));
    expect(onEdit).toHaveBeenLastCalledWith(visit, { revisit: true });

    fireEvent.click(screen.getByRole("button", { name: "天空サウナの記録を編集" }));
    expect(onEdit).toHaveBeenLastCalledWith(visit);
  });

  it("行きたい記録では「行った！」を出す", () => {
    render(<SaunaMarkerPopup visit={{ ...visit, status: "wishlist" }} isWishlist onEdit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "天空サウナに行った記録をつける" })).toHaveTextContent("行った！");
  });

  it("タグを一覧カードと同じく表示だけのチップで出す", () => {
    render(
      <SaunaMarkerPopup visit={{ ...visit, tags: ["外気浴", "水風呂"] }} isWishlist={false} onEdit={vi.fn()} />
    );

    expect(screen.getByText("外気浴")).toBeInTheDocument();
    expect(screen.getByText("水風呂")).toBeInTheDocument();
    // ポップアップには絞り込みが無いため、押しても何も起きないボタンにしない
    expect(screen.queryByRole("button", { name: "外気浴" })).toBeNull();
  });
});
