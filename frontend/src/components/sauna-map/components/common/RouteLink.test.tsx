import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { RouteLink } from "./RouteLink";

describe("RouteLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders route link with correct directions URL", () => {
    render(<RouteLink lat={35.6812} lng={139.7671} />);
    const link = screen.getByRole("link", { name: "ここへ行く" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=35.6812,139.7671"
    );
  });
});
