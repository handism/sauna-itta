import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MapZoomControl } from "./MapZoomControl";

const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();

vi.mock("react-leaflet", () => ({
  useMap: () => ({
    zoomIn: mockZoomIn,
    zoomOut: mockZoomOut,
  }),
}));

describe("MapZoomControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders zoom in and zoom out buttons", () => {
    render(<MapZoomControl />);

    expect(screen.getByRole("button", { name: "拡大" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "縮小" })).toBeInTheDocument();
  });

  it("calls map.zoomIn() when the zoom in button is clicked", () => {
    render(<MapZoomControl />);

    const zoomInBtn = screen.getByRole("button", { name: "拡大" });
    fireEvent.click(zoomInBtn);

    expect(mockZoomIn).toHaveBeenCalledTimes(1);
    expect(mockZoomOut).not.toHaveBeenCalled();
  });

  it("calls map.zoomOut() when the zoom out button is clicked", () => {
    render(<MapZoomControl />);

    const zoomOutBtn = screen.getByRole("button", { name: "縮小" });
    fireEvent.click(zoomOutBtn);

    expect(mockZoomOut).toHaveBeenCalledTimes(1);
    expect(mockZoomIn).not.toHaveBeenCalled();
  });
});
