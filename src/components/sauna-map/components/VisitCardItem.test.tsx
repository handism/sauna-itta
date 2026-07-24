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
    it("renders with role=button, tabIndex=0, aria-selected and handles Enter/Space keys", () => {
      const handleSelect = vi.fn();
      render(
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

      const card = screen.getByRole("button", { name: "天空サウナを選択" });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute("tabIndex", "0");
      expect(card).toHaveAttribute("aria-pressed", "false");

      // Enter key
      fireEvent.keyDown(card, { key: "Enter" });
      expect(handleSelect).toHaveBeenCalledWith(mockVisit);

      // Space key
      fireEvent.keyDown(card, { key: " " });
      expect(handleSelect).toHaveBeenCalledTimes(2);
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
    it("renders compact header with role=button, tabIndex=0, aria-expanded and handles keypress", () => {
      const handleSelect = vi.fn();
      render(
        <VisitCompactItem
          visit={mockVisit}
          isHovered={false}
          isSelected={false}
          onSelectVisit={handleSelect}
          onEdit={vi.fn()}
          setFilters={vi.fn()}
          onOpenImage={vi.fn()}
        />
      );

      const header = screen.getByRole("button", { name: "天空サウナの情報を展開する" });
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute("tabIndex", "0");
      expect(header).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(header, { key: "Enter" });
      expect(handleSelect).toHaveBeenCalledWith(mockVisit);
    });
  });
});
