"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useVisitFilters } from "../hooks/useVisitFilters";
import { useVisitsCRUD } from "./VisitsCRUDContext";

interface VisitFiltersContextType {
  filters: ReturnType<typeof useVisitFilters>["filters"];
  setFilters: ReturnType<typeof useVisitFilters>["setFilters"];
  filteredVisits: ReturnType<typeof useVisitFilters>["filteredVisits"];
  stats: ReturnType<typeof useVisitFilters>["stats"];
  isFilterActive: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
}

const VisitFiltersContext = createContext<VisitFiltersContextType | null>(null);

export function VisitFiltersProvider({ children }: { children: ReactNode }) {
  const { visits } = useVisitsCRUD();

  const {
    filters,
    setFilters,
    filteredVisits,
    stats,
    isFilterActive,
    activeFilterCount,
    clearFilters,
  } = useVisitFilters(visits);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      filteredVisits,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
    }),
    [
      filters,
      setFilters,
      filteredVisits,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
    ],
  );

  return (
    <VisitFiltersContext.Provider value={value}>
      {children}
    </VisitFiltersContext.Provider>
  );
}

export function useVisitFiltersContext() {
  const ctx = useContext(VisitFiltersContext);
  if (!ctx)
    throw new Error(
      "useVisitFiltersContext must be used within VisitFiltersProvider",
    );
  return ctx;
}
