import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import * as reactLeaflet from "react-leaflet";
import { SelectedLocationFocus } from "./SelectedLocationFocus";

vi.mock("react-leaflet", () => ({
  useMap: vi.fn(),
}));

vi.mock("../../utils/motion", () => ({
  prefersReducedMotion: () => false,
}));

describe("SelectedLocationFocus", () => {
  let contains: ReturnType<typeof vi.fn>;
  let mockMap: { getBounds: () => { contains: typeof contains }; getZoom: () => number; flyTo: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    contains = vi.fn();
    mockMap = { getBounds: () => ({ contains }), getZoom: () => 6, flyTo: vi.fn() };
    vi.spyOn(reactLeaflet, "useMap").mockReturnValue(mockMap as unknown as ReturnType<typeof reactLeaflet.useMap>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("表示範囲の外の場所（地点検索の結果）へは移動する", () => {
    contains.mockReturnValue(false);

    render(<SelectedLocationFocus location={{ lat: 35.68, lng: 139.76 }} />);

    expect(mockMap.flyTo).toHaveBeenCalledWith([35.68, 139.76], 13, { animate: true, duration: 1.2 });
  });

  it("表示範囲の中の場所（地図をタップして選んだ場所）では動かさない", () => {
    contains.mockReturnValue(true);

    render(<SelectedLocationFocus location={{ lat: 35.68, lng: 139.76 }} />);

    expect(mockMap.flyTo).not.toHaveBeenCalled();
  });

  it("場所が未選択なら何もしない", () => {
    render(<SelectedLocationFocus location={null} />);

    expect(contains).not.toHaveBeenCalled();
    expect(mockMap.flyTo).not.toHaveBeenCalled();
  });
});
