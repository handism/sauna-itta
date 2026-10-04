import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { RatingStars } from "./RatingStars";

describe("RatingStars", () => {
  afterEach(() => {
    cleanup();
  });

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

describe("RatingStars（未評価）", () => {
  afterEach(() => {
    cleanup();
  });

  it("showUnrated のときは評価 0 を「未評価」と出す", () => {
    const { container } = render(<RatingStars rating={0} showUnrated className="x" />);
    expect(container.firstChild).toHaveTextContent("未評価");
    expect(container.firstChild).toHaveClass("rating-unrated", "x");
  });

  it("評価があれば showUnrated でも星を出す", () => {
    const { container } = render(<RatingStars rating={2} showUnrated />);
    expect(container.querySelectorAll(".rating-star--filled").length).toBe(2);
    expect(container).not.toHaveTextContent("未評価");
  });
});
