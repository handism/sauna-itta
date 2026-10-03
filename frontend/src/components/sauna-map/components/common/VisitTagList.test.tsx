import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitTagList } from "./VisitTagList";

describe("VisitTagList", () => {
  afterEach(() => {
    cleanup();
  });

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
