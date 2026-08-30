import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInitialVisits } from "./useInitialVisits";
import * as utils from "../utils";
import type { VisitRepository } from "../repositories";
import type { SaunaVisit } from "../types";

const mocks = vi.hoisted(() => ({
  DATA_SOURCE: "api",
}));

vi.mock("../utils", () => ({
  getInitialVisits: vi.fn(),
}));

vi.mock("../repositories", () => ({
  get DATA_SOURCE() { return mocks.DATA_SOURCE; }
}));

describe("useInitialVisits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when DATA_SOURCE is 'local' and no repository is injected", () => {
    beforeEach(() => {
      mocks.DATA_SOURCE = "local";
    });

    it("should initialize visits from storage synchronously", () => {
      const mockVisits = [{ id: "1", name: "Sauna 1" }];
      vi.spyOn(utils, "getInitialVisits").mockReturnValue(mockVisits as unknown as SaunaVisit[]);

      const { result } = renderHook(() => useInitialVisits());

      expect(result.current.seededFromStorage).toBe(true);
      expect(result.current.visits).toEqual(mockVisits);
      expect(utils.getInitialVisits).toHaveBeenCalledTimes(1);
    });
  });

  describe("when DATA_SOURCE is 'local' but repository is injected", () => {
    beforeEach(() => {
      mocks.DATA_SOURCE = "local";
    });

    it("should not initialize visits from storage", () => {
      const mockRepository = {} as VisitRepository;

      const { result } = renderHook(() => useInitialVisits(mockRepository));

      expect(result.current.seededFromStorage).toBe(false);
      expect(result.current.visits).toEqual([]);
      expect(utils.getInitialVisits).not.toHaveBeenCalled();
    });
  });

  describe("when DATA_SOURCE is 'api'", () => {
    beforeEach(() => {
      mocks.DATA_SOURCE = "api";
    });

    it("should not initialize visits from storage regardless of injected repository", () => {
      const { result, rerender } = renderHook((props) => useInitialVisits(props.repository), {
        initialProps: { repository: undefined as VisitRepository | undefined },
      });

      expect(result.current.seededFromStorage).toBe(false);
      expect(result.current.visits).toEqual([]);
      expect(utils.getInitialVisits).not.toHaveBeenCalled();

      // Test with injected repository
      const mockRepository = {} as VisitRepository;
      rerender({ repository: mockRepository });

      expect(result.current.seededFromStorage).toBe(false);
      expect(result.current.visits).toEqual([]);
    });
  });

  it("should allow updating visits", () => {
    mocks.DATA_SOURCE = "api";

    const { result } = renderHook(() => useInitialVisits());

    expect(result.current.visits).toEqual([]);

    act(() => {
      result.current.setVisits([{ id: "2", name: "Sauna 2" }] as unknown as SaunaVisit[]);
    });

    expect(result.current.visits).toEqual([{ id: "2", name: "Sauna 2" }]);
  });
});
