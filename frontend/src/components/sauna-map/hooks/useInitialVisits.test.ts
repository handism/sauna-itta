import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useInitialVisits } from "./useInitialVisits";
import type { SaunaVisit } from "../types";

const mockVisits: SaunaVisit[] = [
  {
    id: "1",
    name: "Mock Sauna",
    date: "2023-01-01",
    lat: 35,
    lng: 139,
    rating: 5,
    comment: "Nice",
  } as unknown as SaunaVisit,
];

vi.mock("../utils", () => ({
  loadSavedVisits: vi.fn(() => ({ visits: mockVisits, unreadable: [{ broken: true }] })),
}));

import { loadSavedVisits } from "../utils";

describe("useInitialVisits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seedFromStorage が true なら保存済みの記録を同期的に読み込むこと", () => {
    const { result } = renderHook(() => useInitialVisits(true));

    expect(loadSavedVisits).toHaveBeenCalledTimes(1);
    expect(result.current.visits).toEqual(mockVisits);
    expect(result.current.unreadableCount).toBe(1);
  });

  it("seedFromStorage が false なら保存を読まずに空から始めること", () => {
    const { result } = renderHook(() => useInitialVisits(false));

    expect(loadSavedVisits).not.toHaveBeenCalled();
    expect(result.current.visits).toEqual([]);
    expect(result.current.unreadableCount).toBe(0);
  });

  it("再レンダリングで保存を読み直さないこと", () => {
    const { rerender } = renderHook(() => useInitialVisits(true));
    rerender();

    expect(loadSavedVisits).toHaveBeenCalledTimes(1);
  });
});
