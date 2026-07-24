import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { RatingStars, WishlistChip, VisitTagList, VisitMetaInfo, RouteLink } from "./common";

describe("common components", () => {
  afterEach(() => {
    cleanup();
  });

  describe("RatingStars", () => {
    it("renders nothing when rating is 0 or negative", () => {
      const { container } = render(<RatingStars rating={0} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders 5 star icons with correct filled state", () => {
      const { container } = render(<RatingStars rating={3} />);
      const filledStars = container.querySelectorAll(".rating-star--filled");
      expect(filledStars.length).toBe(3);
    });
  });

  describe("WishlistChip", () => {
    it("renders wishlist chip correctly", () => {
      render(<WishlistChip />);
      expect(screen.getByText("行きたい")).toBeInTheDocument();
    });
  });

  describe("VisitTagList", () => {
    it("returns null when no tags are provided", () => {
      const { container } = render(<VisitTagList tags={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders tags and handles click events", () => {
      const mockSelectTag = vi.fn();
      render(<VisitTagList tags={["サウナ", "水風呂"]} onSelectTag={mockSelectTag} />);

      const tagButton = screen.getByText("サウナ");
      expect(tagButton).toBeInTheDocument();

      fireEvent.click(tagButton);
      expect(mockSelectTag).toHaveBeenCalledWith("サウナ");
    });
  });

  describe("VisitMetaInfo", () => {
    it("renders visit date and count correctly", () => {
      render(<VisitMetaInfo date="2026-07-24" visitCount={3} />);
      expect(screen.getByText("日付: 2026-07-24")).toBeInTheDocument();
      expect(screen.getByText("訪問 3回目")).toBeInTheDocument();
    });

    it("does not render visit count when count is 1", () => {
      render(<VisitMetaInfo date="2026-07-24" visitCount={1} />);
      expect(screen.getByText("日付: 2026-07-24")).toBeInTheDocument();
      expect(screen.queryByText(/訪問.*回目/)).not.toBeInTheDocument();
    });
  });

  describe("RouteLink", () => {
    it("renders route link with correct directions URL", () => {
      render(<RouteLink lat={35.6812} lng={139.7671} />);
      const link = screen.getByRole("link", { name: "ここへ行く" });
      expect(link).toHaveAttribute(
        "href",
        "https://www.google.com/maps/dir/?api=1&destination=35.6812,139.7671"
      );
    });
  });
});
