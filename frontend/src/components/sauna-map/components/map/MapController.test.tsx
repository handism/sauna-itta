import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { MapController, SELECT_ZOOM } from "./MapController";
import * as reactLeaflet from "react-leaflet";
import * as motion from "../../utils/motion";

vi.mock("react-leaflet", () => ({
  useMap: vi.fn(),
}));

// We must mock the module before we can spy on its exports in ES modules
vi.mock("../../utils/motion", () => ({
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

  it("flies to target with SELECT_ZOOM (13) when current zoom is less than it", () => {
    mockMap.getZoom.mockReturnValue(10);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

    expect(SELECT_ZOOM).toBe(13);
    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0, 139.0],
      13,
      { animate: true, duration: 1.2 }
    );
  });

  it("flies to target with current zoom when already zoomed in further", () => {
    mockMap.getZoom.mockReturnValue(16);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0, 139.0],
      16,
      { animate: true, duration: 1.2 }
    );
  });

  it("applies the mobile offset at zoom 13 (twice the zoom 14 offset)", () => {
    mockMap.getZoom.mockReturnValue(10);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile={true} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0 - 0.009, 139.0],
      13,
      { animate: true, duration: 1.2 }
    );
  });

  it("applies correct mobile offset for zoom 14", () => {
    mockMap.getZoom.mockReturnValue(14);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile={true} />);

    // latOffset at zoom 14 is 0.0045
    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0 - 0.0045, 139.0],
      14,
      { animate: true, duration: 1.2 }
    );
  });

  it("halves the mobile offset at zoom 15", () => {
    mockMap.getZoom.mockReturnValue(15);
    vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);

    render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile={true} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith(
      [35.0 - 0.00225, 139.0],
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

  describe("デスクトップのサイドバー", () => {
    const rect = (left: number, right: number) =>
      ({ left, right, width: right - left, top: 0, bottom: 800, height: 800, x: left, y: 0 }) as DOMRect;

    let sidebar: HTMLElement;
    let project: ReturnType<typeof vi.fn>;
    let unproject: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sidebar = document.createElement("aside");
      sidebar.className = "sidebar";
      sidebar.getBoundingClientRect = () => rect(0, 460);
      document.body.appendChild(sidebar);

      const container = document.createElement("div");
      container.getBoundingClientRect = () => rect(0, 1440);
      const subtract = vi.fn(([dx, dy]: [number, number]) => ({ x: 1000 - dx, y: 500 - dy }));
      project = vi.fn(() => ({ x: 1000, y: 500, subtract }));
      unproject = vi.fn(() => ({ lat: 35.0, lng: 138.9 }));
      Object.assign(mockMap, { getContainer: () => container, project, unproject });
      mockMap.getZoom.mockReturnValue(14);
      vi.spyOn(motion, "prefersReducedMotion").mockReturnValue(false);
    });

    afterEach(() => {
      sidebar.remove();
    });

    it("覆われた幅の半分だけ中心を左へずらし、マーカーを見えている領域の中央へ置く", () => {
      render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

      expect(project).toHaveBeenCalledWith([35.0, 139.0], 14);
      expect(unproject).toHaveBeenCalledWith({ x: 1000 - 230, y: 500 }, 14);
      expect(mockMap.flyTo).toHaveBeenCalledWith([35.0, 138.9], 14, { animate: true, duration: 1.2 });
    });

    it("サイドバーを折りたたんでいるときはずらさない", () => {
      sidebar.classList.add("collapsed");

      render(<MapController target={{ lat: 35.0, lng: 139.0 }} />);

      expect(project).not.toHaveBeenCalled();
      expect(mockMap.flyTo).toHaveBeenCalledWith([35.0, 139.0], 14, { animate: true, duration: 1.2 });
    });

    it("モバイルではサイドバーの幅を見ない", () => {
      render(<MapController target={{ lat: 35.0, lng: 139.0 }} isMobile />);

      expect(project).not.toHaveBeenCalled();
    });
  });
});
