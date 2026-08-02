import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitCardItem } from "./VisitCardItem";
import { VisitCompactItem } from "./VisitCompactItem";
import { SaunaVisit } from "../types";

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

describe("Keyboard Accessibility for Card & Compact Items", () => {
  afterEach(() => {
    cleanup();
  });

  describe("VisitCardItem Accessibility", () => {
    it("見出し内のネイティブボタンで選択でき、カード自体は role=button にしないこと", () => {
      const handleSelect = vi.fn();
      const { container } = render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={handleSelect}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );

      // 対話要素の入れ子を避けるため、カード本体は role="button" を持たない
      expect(container.querySelector(".sauna-card")).not.toHaveAttribute("role");

      const selectBtn = screen.getByRole("button", { name: "天空サウナ" });
      expect(selectBtn.tagName).toBe("BUTTON");
      expect(selectBtn).toHaveAttribute("aria-pressed", "false");
      // ネイティブ button なので tabindex を付けなくてもフォーカスできる
      expect(selectBtn).not.toHaveAttribute("tabindex");
      expect(selectBtn.closest("h3")).not.toBeNull();

      fireEvent.click(selectBtn);
      expect(handleSelect).toHaveBeenCalledWith(mockVisit);
    });

    it("handles image preview button keyboard focus and click", () => {
      const handleOpenImage = vi.fn();
      render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={vi.fn()}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={handleOpenImage}
        />
      );

      const imgBtn = screen.getByRole("button", { name: "天空サウナの写真を拡大表示" });
      expect(imgBtn).toBeInTheDocument();

      fireEvent.click(imgBtn);
      expect(handleOpenImage).toHaveBeenCalledWith(mockVisit.image);
    });
  });

  describe("VisitCompactItem Accessibility", () => {
    it("開閉トグルが見出し内のネイティブボタンで、編集ボタンと入れ子にならないこと", () => {
      const handleSelect = vi.fn();
      const handleEdit = vi.fn();
      render(
        <VisitCompactItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={handleSelect}
          onEdit={handleEdit}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
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
    const compactProps = {
      visit: mockVisit,
      isHovered: false,
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

    it("展開中の解除ボタンは折りたたみを一度だけ呼ぶ", () => {
      const handleDeselect = vi.fn();
      render(
        <VisitCompactItem
          {...compactProps}
          isSelected
          onSelectVisit={vi.fn()}
          onDeselectVisit={handleDeselect}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /解除/ }));

      expect(handleDeselect).toHaveBeenCalledOnce();
    });

    it("展開中のタグをクリックすると検索条件へ反映する", () => {
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

      expect(setFilters.mock.results[0].value).toEqual({ search: "水風呂" });
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
  });

  describe("VisitCardItem の操作", () => {
    it("カードのホバーとクリックで選択・ホバー状態を伝える", () => {
      const handleHover = vi.fn();
      const handleSelect = vi.fn();
      const { container } = render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onHoverVisit={handleHover}
          onSelectVisit={handleSelect}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );
      const card = container.querySelector(".sauna-card") as HTMLElement;

      fireEvent.mouseEnter(card);
      expect(handleHover).toHaveBeenCalledWith("sauna-1");

      fireEvent.mouseLeave(card);
      expect(handleHover).toHaveBeenLastCalledWith(null);

      fireEvent.click(card);
      expect(handleSelect).toHaveBeenCalledWith(mockVisit);
    });

    it("編集ボタンはカードのクリックを伝播させない", () => {
      const handleSelect = vi.fn();
      const handleEdit = vi.fn();
      render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={handleSelect}
          onEdit={handleEdit}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /編集/ }));

      expect(handleEdit).toHaveBeenCalledWith(mockVisit);
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it("選択中だけ解除ボタンを出し、カードの選択を再実行しない", () => {
      const handleSelect = vi.fn();
      const handleDeselect = vi.fn();
      const { rerender } = render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={handleSelect}
          onDeselectVisit={handleDeselect}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );
      expect(screen.queryByRole("button", { name: "選択を解除" })).not.toBeInTheDocument();

      rerender(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected
          onSelectVisit={handleSelect}
          onDeselectVisit={handleDeselect}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "選択を解除" }));

      expect(handleDeselect).toHaveBeenCalledOnce();
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it("タグをクリックすると検索条件へ反映する", () => {
      const setFilters = vi.fn((updater) => updater({ search: "" }));
      render(
        <VisitCardItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={vi.fn()}
          onEdit={vi.fn()}
          setFilters={setFilters}
          onOpenImage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /外気浴/ }));

      expect(setFilters).toHaveBeenCalledOnce();
      expect(setFilters.mock.results[0].value).toEqual({ search: "外気浴" });
    });

    it("行きたい記録には行きたいチップを出す", () => {
      render(
        <VisitCardItem
          visit={{ ...mockVisit, status: "wishlist" }}
          isHovered={false}
          isSelected={false}
          onSelectVisit={vi.fn()}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );

      expect(screen.getByText("行きたい")).toBeInTheDocument();
    });
  });
});
