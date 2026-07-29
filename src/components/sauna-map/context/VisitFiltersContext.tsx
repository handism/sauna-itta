"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useVisitFilters } from "../hooks/useVisitFilters";
import { useVisitsCRUD } from "./VisitsCRUDContext";

interface VisitFiltersContextType {
  filters: ReturnType<typeof useVisitFilters>["filters"];
  filteredVisits: ReturnType<typeof useVisitFilters>["filteredVisits"];
  stats: ReturnType<typeof useVisitFilters>["stats"];
  isFilterActive: boolean;
  activeFilterCount: number;
}

interface VisitFilterActionsContextType {
  setFilters: ReturnType<typeof useVisitFilters>["setFilters"];
  clearFilters: () => void;
}

const VisitFiltersContext = createContext<VisitFiltersContextType | null>(null);
const VisitFilterActionsContext =
  createContext<VisitFilterActionsContextType | null>(null);

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

  const stateValue = useMemo(
    () => ({
      filters,
      filteredVisits,
      stats,
      isFilterActive,
      activeFilterCount,
    }),
    [
      filters,
      filteredVisits,
      stats,
      isFilterActive,
      activeFilterCount,
    ],
  );

  const actionsValue = useMemo(
    () => ({ setFilters, clearFilters }),
    [setFilters, clearFilters],
  );

  return (
    <VisitFiltersContext.Provider value={stateValue}>
      <VisitFilterActionsContext.Provider value={actionsValue}>
        {children}
      </VisitFilterActionsContext.Provider>
    </VisitFiltersContext.Provider>
  );
}

export function useVisitFiltersState() {
  const context = useContext(VisitFiltersContext);
  if (!context) {
    throw new Error(
      "useVisitFiltersState must be used within VisitFiltersProvider",
    );
  }
  return context;
}

export function useVisitFilterActions() {
  const context = useContext(VisitFilterActionsContext);
  if (!context) {
    throw new Error(
      "useVisitFilterActions must be used within VisitFiltersProvider",
    );
  }
  return context;
}

export function useVisitFiltersContext() {
  const state = useVisitFiltersState();
  const actions = useVisitFilterActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
