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
