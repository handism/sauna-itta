import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitMetaInfo } from "./VisitMetaInfo";

describe("VisitMetaInfo", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders visit date and count correctly", () => {
    render(<VisitMetaInfo date="2026-07-24" visitCount={3} />);
    expect(screen.getByText("行った日:", { exact: false })).toHaveTextContent(
      "行った日: 2026年7月24日（金）"
    );
    expect(screen.getByText("2026年7月24日（金）")).toHaveAttribute("datetime", "2026-07-24");
    expect(screen.getByText("訪問 3回目")).toBeInTheDocument();
  });

  it("does not render visit count when count is 1", () => {
    render(<VisitMetaInfo date="2026-07-24" visitCount={1} />);
    expect(screen.getByText("2026年7月24日（金）")).toBeInTheDocument();
    expect(screen.queryByText(/訪問.*回目/)).not.toBeInTheDocument();
  });

  it("行きたい記録では日付も回数も出さない", () => {
    const { container } = render(
      <VisitMetaInfo date="2026-07-24" visitCount={2} isWishlist />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
