import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useInitialVisits } from "./useInitialVisits";
import type { VisitRepository } from "../repositories";
import type { SaunaVisit } from "../types";

const mocks = vi.hoisted(() => ({
  DATA_SOURCE: "local" as "local" | "api",
}));

vi.mock("../repositories", () => ({
  get DATA_SOURCE() {
    return mocks.DATA_SOURCE;
  },
}));

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
  getInitialVisits: vi.fn(() => mockVisits),
}));

import { getInitialVisits } from "../utils";

describe("useInitialVisits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.DATA_SOURCE = "local"; // reset to default
  });

  it("should seed from storage when DATA_SOURCE is 'local' and no repository is injected", () => {
    mocks.DATA_SOURCE = "local";
    const { result } = renderHook(() => useInitialVisits());

    expect(result.current.seededFromStorage).toBe(true);
    expect(getInitialVisits).toHaveBeenCalledTimes(1);
    expect(result.current.visits).toEqual(mockVisits);
  });

  it("should not seed from storage when repository is injected", () => {
    mocks.DATA_SOURCE = "local";
    const mockRepo = {} as VisitRepository;
    const { result } = renderHook(() => useInitialVisits(mockRepo));

    expect(result.current.seededFromStorage).toBe(false);
    expect(getInitialVisits).not.toHaveBeenCalled();
    expect(result.current.visits).toEqual([]);
  });

  it("should not seed from storage when DATA_SOURCE is 'api'", () => {
    mocks.DATA_SOURCE = "api";
    const { result } = renderHook(() => useInitialVisits());

    expect(result.current.seededFromStorage).toBe(false);
    expect(getInitialVisits).not.toHaveBeenCalled();
    expect(result.current.visits).toEqual([]);
  });
});
