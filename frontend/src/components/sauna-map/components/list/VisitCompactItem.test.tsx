import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitCompactItem } from "./VisitCompactItem";
import { SaunaVisit } from "../../types";

const mockVisit: SaunaVisit = {
  id: "sauna-1",
  name: "天空サウナ",
  area: "東京",
  lat: 35.6895,
  lng: 139.6917,
  date: "2026-07-24",
  comment: "最高のととのい",
  rating: 5,
  tags: ["外気浴", "水風呂"],
  image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  status: "visited",
  visitCount: 2,
};

describe("VisitCompactItem Accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  const compactProps = {
    visit: mockVisit,
    isHovered: false,
    isSelected: false,
    onEdit: vi.fn(),
    setFilters: vi.fn(),
    onOpenImage: vi.fn(),
  };

  it("開閉トグルが見出し内のネイティブボタンで、編集ボタンと入れ子にならないこと", () => {
    const handleSelect = vi.fn();
    const handleEdit = vi.fn();
    render(
      <VisitCompactItem
        {...compactProps}
        onSelectVisit={handleSelect}
        onEdit={handleEdit}
      />
    );

    const toggle = screen.getByRole("button", { name: "天空サウナの情報を展開する" });
    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // ネイティブ button なので tabindex を付けなくてもフォーカスできる
    expect(toggle).not.toHaveAttribute("tabindex");
    expect(toggle.closest("h3")).not.toBeNull();

    const editBtn = screen.getByRole("button", { name: "天空サウナの記録を編集" });
    // ボタンの入れ子は ARIA 上不正なため、必ず兄弟要素であること
    expect(toggle.contains(editBtn)).toBe(false);

    fireEvent.click(toggle);
    expect(handleSelect).toHaveBeenCalledWith(mockVisit);

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockVisit);
  });
});

describe("VisitCompactItem の操作", () => {
  afterEach(() => {
    cleanup();
  });

  const compactProps = {
    visit: mockVisit,
    isHovered: false,
    isSelected: false,
    onEdit: vi.fn(),
    setFilters: vi.fn(),
    onOpenImage: vi.fn(),
  };

  it("展開中はトグルで折りたたみ、選択は再実行しない", () => {
    const handleSelect = vi.fn();
    const handleDeselect = vi.fn();
    render(
      <VisitCompactItem
        {...compactProps}
        isSelected
        onSelectVisit={handleSelect}
        onDeselectVisit={handleDeselect}
      />
    );

    const toggle = screen.getByRole("button", { name: "天空サウナの情報を折りたたむ" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);

    expect(handleDeselect).toHaveBeenCalledOnce();
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("展開時だけ詳細・写真・経路リンクを描画する", () => {
    const onOpenImage = vi.fn();
    const { rerender } = render(
      <VisitCompactItem {...compactProps} isSelected={false} onSelectVisit={vi.fn()} />
    );
    expect(screen.queryByText("最高のととのい")).not.toBeInTheDocument();

    rerender(
      <VisitCompactItem
        {...compactProps}
        isSelected
        onSelectVisit={vi.fn()}
        onOpenImage={onOpenImage}
      />
    );

    expect(screen.getByText("最高のととのい")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ここへ行く/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /天空サウナの写真/ }));
    expect(onOpenImage).toHaveBeenCalledWith(mockVisit.image);
  });

  it("展開中の閉じるボタンは折りたたみを一度だけ呼ぶ", () => {
    const handleDeselect = vi.fn();
    render(
      <VisitCompactItem
        {...compactProps}
        isSelected
        onSelectVisit={vi.fn()}
        onDeselectVisit={handleDeselect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(handleDeselect).toHaveBeenCalledOnce();
  });

  it("展開中のタグをクリックするとタグの絞り込みへ反映する（文字の検索にはしない）", () => {
    const setFilters = vi.fn((updater) => updater({ search: "" }));
    render(
      <VisitCompactItem
        {...compactProps}
        isSelected
        onSelectVisit={vi.fn()}
        setFilters={setFilters}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /水風呂/ }));

    expect(setFilters.mock.results[0].value).toEqual({ search: "", selectedTag: "水風呂" });
  });

  it("行の出入りでホバー状態を伝える", () => {
    const handleHover = vi.fn();
    const { container } = render(
      <VisitCompactItem
        {...compactProps}
        isSelected={false}
        onSelectVisit={vi.fn()}
        onHoverVisit={handleHover}
      />
    );
    const row = container.querySelector(".sauna-compact-item") as HTMLElement;

    fireEvent.mouseEnter(row);
    expect(handleHover).toHaveBeenCalledWith("sauna-1");

    fireEvent.mouseLeave(row);
    expect(handleHover).toHaveBeenLastCalledWith(null);
  });

  it("行きたい記録には行きたいチップを出す", () => {
    render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, status: "wishlist" }}
        isSelected={false}
        onSelectVisit={vi.fn()}
      />
    );

    expect(screen.getByText("行きたい")).toBeInTheDocument();
  });

  it("エリアがない場合エリア情報を表示しないこと", () => {
    render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, area: "" }}
        isSelected={false}
      />
    );

    expect(screen.queryByText("東京")).not.toBeInTheDocument();
  });

  it("サムネイル画像がない場合画像要素を描画しないこと", () => {
    const { container } = render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, image: "" }}
        isSelected={false}
      />
    );

    // .sauna-compact-thumb が描画されていないことを確認
    expect(container.querySelector(".sauna-compact-thumb")).toBeNull();
  });

  it("コメントがない場合コメント要素を描画しないこと", () => {
    render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, comment: "" }}
        isSelected={true}
      />
    );

    expect(screen.queryByText("最高のととのい")).not.toBeInTheDocument();
    // コメント用の p タグがないことも確認できる
    expect(screen.queryByText("sauna-card-comment")).not.toBeInTheDocument();
  });

  it("折りたたんだ状態でも訪問回数と最終訪問日を表示すること", () => {
    render(<VisitCompactItem {...compactProps} isSelected={false} />);

    expect(screen.getByText("2回 · 最終 2026/7/24")).toBeInTheDocument();
  });

  it("行きたい記録は訪問回数・日付の代わりに状態とエリアを 2 行目へ出すこと", () => {
    const { container } = render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, status: "wishlist" }}
        isSelected={false}
      />
    );

    // 訪問済みの行と同じ 2 行構成にして、一覧の行の高さを揃える
    const meta = container.querySelector(".sauna-compact-meta");
    expect(meta).toHaveTextContent("行きたい");
    expect(meta).toHaveTextContent("東京");
    expect(screen.queryByText(/回 · 最終/)).not.toBeInTheDocument();
  });

  it("施設名は 1 行目に単独で置き、エリアは 2 行目に回すこと", () => {
    const { container } = render(<VisitCompactItem {...compactProps} isSelected={false} />);

    expect(container.querySelector(".sauna-compact-title")).toHaveTextContent(/^天空サウナ$/);
    expect(container.querySelector(".sauna-compact-meta")).toHaveTextContent("東京2回 · 最終 2026/7/24");
  });

  it("行きたい記録では状態と同名の「行きたい」タグを重ねて表示しないこと", () => {
    render(
      <VisitCompactItem
        {...compactProps}
        visit={{ ...mockVisit, status: "wishlist", tags: ["行きたい", "外気浴"] }}
        isSelected
      />
    );

    expect(screen.getByRole("button", { name: "外気浴" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "行きたい" })).not.toBeInTheDocument();
  });
});
