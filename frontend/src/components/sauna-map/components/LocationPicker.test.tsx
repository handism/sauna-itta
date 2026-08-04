import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocationPicker } from "./LocationPicker";

// Mock react-leaflet's useMapEvents
const mockUseMapEvents = vi.fn();
vi.mock("react-leaflet", () => ({
  useMapEvents: (handlers: unknown) => mockUseMapEvents(handlers),
}));

describe("LocationPicker", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("registers a click event and calls onLocationSelect with correct coordinates", () => {
    const mockOnLocationSelect = vi.fn();

    // Render the component
    render(<LocationPicker onLocationSelect={mockOnLocationSelect} />);

    // Verify useMapEvents was called
    expect(mockUseMapEvents).toHaveBeenCalledTimes(1);

    // Extract the handlers passed to useMapEvents
    const handlers = mockUseMapEvents.mock.calls[0][0];
    expect(handlers).toHaveProperty("click");

    // Simulate a map click event
    const mockEvent = {
      latlng: {
        lat: 35.6812,
        lng: 139.7671,
      },
    };

    handlers.click(mockEvent);

    // Verify onLocationSelect was called with the correct lat and lng
    expect(mockOnLocationSelect).toHaveBeenCalledTimes(1);
    expect(mockOnLocationSelect).toHaveBeenCalledWith(35.6812, 139.7671);
  });

  it("renders null", () => {
    const { container } = render(<LocationPicker onLocationSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
