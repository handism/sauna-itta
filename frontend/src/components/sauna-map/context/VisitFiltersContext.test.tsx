import React from "react";
import { render, renderHook, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

import {
  VisitFiltersProvider,
  useVisitFiltersState,
  useVisitFilterActions,
  useVisitFiltersContext,
} from "./VisitFiltersContext";

import * as VisitsCRUDContext from "./VisitsCRUDContext";

const mockVisits = [
  {
    id: "1",
    name: "かるまる",
    lat: 35.7314,
    lng: 139.7111,
    comment: "池袋の最高サウナ",
    date: "2026-01-10",
    rating: 5,
    visitCount: 3,
    status: "visited",
  },
];

describe("VisitFiltersContext", () => {
  beforeEach(() => {
    vi.spyOn(VisitsCRUDContext, "useVisitsCRUD").mockReturnValue({
      visits: mockVisits,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("should provide state through useVisitFiltersState", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    );

    const { result } = renderHook(() => useVisitFiltersState(), { wrapper });

    expect(result.current.filteredVisits).toHaveLength(1);
    expect(result.current.filteredVisits[0].name).toBe("かるまる");
    expect(result.current.isFilterActive).toBe(false);
  });

  it("should provide actions through useVisitFilterActions", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    );

    const { result } = renderHook(() => useVisitFilterActions(), { wrapper });

    expect(typeof result.current.setFilters).toBe("function");
    expect(typeof result.current.clearFilters).toBe("function");
  });

  it("should provide combined state and actions through useVisitFiltersContext", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    );

    const { result } = renderHook(() => useVisitFiltersContext(), { wrapper });

    expect(result.current.filteredVisits).toHaveLength(1);
    expect(result.current.filteredVisits[0].name).toBe("かるまる");
    expect(typeof result.current.setFilters).toBe("function");
  });

  it("should update filters when setFilters is called", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    );

    const { result } = renderHook(() => useVisitFiltersContext(), { wrapper });

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, search: "かるまる" }));
    });

    expect(result.current.filters.search).toBe("かるまる");
    expect(result.current.isFilterActive).toBe(true);
  });

  it("should throw error when useVisitFiltersState is used outside provider", () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useVisitFiltersState())).toThrow(
      "useVisitFiltersState must be used within VisitFiltersProvider"
    );

    consoleSpy.mockRestore();
  });

  it("should throw error when useVisitFilterActions is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useVisitFilterActions())).toThrow(
      "useVisitFilterActions must be used within VisitFiltersProvider"
    );

    consoleSpy.mockRestore();
  });
});
