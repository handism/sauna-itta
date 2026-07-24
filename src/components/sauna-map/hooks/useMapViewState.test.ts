import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMapViewState } from "./useMapViewState";
import { SaunaVisit } from "../types";

const mockVisits: SaunaVisit[] = [
  {
    id: "1",
    name: "サウナしきじ",
    lat: 34.95,
    lng: 138.40,
    rating: 5,
    comment: "聖地",
    date: "2026-01-01",
  },
  {
    id: "2",
    name: "かるまる",
    lat: 35.73,
    lng: 139.71,
    rating: 4,
    comment: "最高",
    date: "2026-01-02",
  },
];

describe("useMapViewState", () => {
  it("初期状態が正しく設定されること", () => {
    const { result } = renderHook(() => useMapViewState(mockVisits, false));

    expect(result.current.hoveredId).toBeNull();
    expect(result.current.selectedId).toBeNull();
    expect(result.current.mapTargetOverride).toBeNull();
    expect(result.current.snapPosition).toBe("min");
    expect(result.current.zoomLevel).toBe(6);
    expect(result.current.enableClustering).toBe(true);
    expect(result.current.showBadges).toBe(false);
    expect(result.current.selectedVisit).toBeUndefined();
  });

  it("handleSelectVisitで対象が選択されオーバーライド設定されること", () => {
    const { result } = renderHook(() => useMapViewState(mockVisits, false));

    act(() => {
      result.current.handleSelectVisit(mockVisits[0]);
    });

    expect(result.current.selectedId).toBe("1");
    expect(result.current.hoveredId).toBe("1");
    expect(result.current.mapTargetOverride).toEqual({ lat: 34.95, lng: 138.40 });
    expect(result.current.selectedVisit).toEqual(mockVisits[0]);
  });

  it("handleDeselectVisitで選択状態がリセットされること", () => {
    const { result } = renderHook(() => useMapViewState(mockVisits, false));

    act(() => {
      result.current.handleSelectVisit(mockVisits[0]);
    });
    expect(result.current.selectedId).toBe("1");

    act(() => {
      result.current.handleDeselectVisit();
    });

    expect(result.current.selectedId).toBeNull();
    expect(result.current.hoveredId).toBeNull();
    expect(result.current.mapTargetOverride).toBeNull();
  });

  it("ズームレベルによりshowBadgesの判定が切り替わること", () => {
    const { result } = renderHook(() => useMapViewState(mockVisits, false));

    expect(result.current.showBadges).toBe(false);

    act(() => {
      result.current.handleZoomChange(13);
    });

    expect(result.current.showBadges).toBe(true);
  });

  it("toggleClusteringでクラスタリング有効無効が切り替わること", () => {
    const { result } = renderHook(() => useMapViewState(mockVisits, false));

    expect(result.current.enableClustering).toBe(true);

    act(() => {
      result.current.toggleClustering();
    });

    expect(result.current.enableClustering).toBe(false);
  });
});
