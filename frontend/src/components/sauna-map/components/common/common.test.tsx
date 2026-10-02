import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { RatingStars, WishlistChip, VisitTagList, VisitMetaInfo, RouteLink, VisitComment } from "./common";

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

  describe("VisitComment", () => {
    // jsdom はレイアウトを計算しないため、省略中の高さとあふれた高さを差し替えて判定させる
    const mockOverflow = (scrollHeight: number, clientHeight: number) => {
      vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
      vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("空のコメントは何も描画しない", () => {
      const { container } = render(<VisitComment text="" className="sauna-card-comment" />);
      expect(container.firstChild).toBeNull();
    });

    it("あふれていなければ「続きを読む」を出さない", () => {
      mockOverflow(40, 40);
      render(<VisitComment text="短いコメント" className="sauna-card-comment" />);
      expect(screen.getByText("短いコメント")).toHaveClass("is-clamped");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("あふれていれば「続きを読む」で全文を展開し、「閉じる」で戻す", () => {
      mockOverflow(120, 60);
      const onParentClick = vi.fn();
      render(
        <div onClick={onParentClick}>
          <VisitComment text="長いコメント" className="sauna-card-comment" />
        </div>
      );

      const toggle = screen.getByRole("button", { name: "続きを読む" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveAttribute("aria-controls", screen.getByText("長いコメント").id);

      fireEvent.click(toggle);
      expect(screen.getByText("長いコメント")).not.toHaveClass("is-clamped");
      expect(screen.getByRole("button", { name: "閉じる" })).toHaveAttribute("aria-expanded", "true");
      // 一覧カードの選択（親のクリック）を巻き込まない
      expect(onParentClick).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
      expect(screen.getByText("長いコメント")).toHaveClass("is-clamped");
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
