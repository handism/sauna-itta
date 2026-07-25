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

      const imgBtn = screen.getByRole("button", { name: "天空サウナの写真拡大表示" });
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
});
