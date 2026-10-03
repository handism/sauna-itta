import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { WishlistChip } from "./WishlistChip";

describe("WishlistChip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders wishlist chip correctly", () => {
    render(<WishlistChip />);
    expect(screen.getByText("行きたい")).toBeInTheDocument();
  });
});
