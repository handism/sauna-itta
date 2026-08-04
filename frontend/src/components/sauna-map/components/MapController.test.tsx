import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { MapController } from "./MapController";
import * as reactLeaflet from "react-leaflet";
import * as motion from "../utils/motion";

vi.mock("react-leaflet", () => ({
  useMap: vi.fn(),
}));

// We must mock the module before we can spy on its exports in ES modules
vi.mock("../utils/motion", () => ({
  prefersReducedMotion: vi.fn(),
}));

describe("MapController", () => {
  let mockMap: { getZoom: ReturnType<typeof vi.fn>; flyTo: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockMap = {
      getZoom: vi.fn(),
      flyTo: vi.fn(),
    };
    // The cast is needed because useMap expects a full Map instance,
    // but we only implement the methods we need
    vi.spyOn(reactLeaflet, "useMap").mockReturnValue(mockMap as unknown as ReturnType<typeof reactLeaflet.useMap>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("does nothing when target is null", () => {
    render(<MapController target={null} />);
    expect(mockMap.getZoom).not.toHaveBeenCalled();
    expect(mockMap.flyTo).not.toHaveBeenCalled();
  });

  it("flies to target with zoom 14 when current zoom is less than 14", () => {
    mockMap.getZoom.mockReturnValue(10);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0, 139.0],
      14,
      { animate: true, duration: 1.2 }
    );
  });

  it("flies to target with current zoom when current zoom is 14 or greater", () => {
    mockMap.getZoom.mockReturnValue(16);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0, 139.0],
      16,
      { animate: true, duration: 1.2 }
    );
  });

  it("applies correct mobile offset for zoom < 15", () => {
    mockMap.getZoom.mockReturnValue(14);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile={true} />);

    // latOffset for zoom < 15 is 0.0045
    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0 - 0.0045, 139.0],
      14,
      { animate: true, duration: 1.2 }
    );
  });

  it("applies correct mobile offset for zoom >= 15", () => {
    mockMap.getZoom.mockReturnValue(15);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile={true} />);

    // latOffset for zoom >= 15 is 0.0025
    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0 - 0.0025, 139.0],
      15,
      { animate: true, duration: 1.2 }
    );
  });

  it("respects prefersReducedMotion to disable animations", () => {
    mockMap.getZoom.mockReturnValue(14);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(true);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0, 139.0],
      14,
      { animate: false, duration: 1.2 }
    );
  });
});
