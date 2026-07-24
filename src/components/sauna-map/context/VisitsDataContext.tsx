"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  ChangeEvent,
  RefObject,
} from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useVisitFilters } from "../hooks/useVisitFilters";
import { useSaunaUI } from "./UIContext";
import { SaunaVisit } from "../types";

interface VisitsDataContextType {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: ReturnType<typeof useVisitFilters>["filters"];
  setFilters: ReturnType<typeof useVisitFilters>["setFilters"];
  stats: ReturnType<typeof useVisitFilters>["stats"];
  isFilterActive: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
  exportVisits: () => void;
  handleImportData: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  importing: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  addVisit: ReturnType<typeof useSaunaVisits>["addVisit"];
  editVisit: ReturnType<typeof useSaunaVisits>["editVisit"];
  deleteVisit: ReturnType<typeof useSaunaVisits>["deleteVisit"];
  removeHistoryEntry: ReturnType<typeof useSaunaVisits>["removeHistoryEntry"];
}

const VisitsDataContext = createContext<VisitsDataContextType | null>(null);

export function VisitsDataProvider({ children }: { children: ReactNode }) {
  const { showToast } = useSaunaUI();

  const {
    visits,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    exportVisits,
    handleImportData,
    importing,
    importInputRef,
  } = useSaunaVisits(showToast);

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
      visits,
      filteredVisits,
      filters,
      setFilters,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
      exportVisits,
      handleImportData,
      importing,
      importInputRef,
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
    }),
    [
      visits,
      filteredVisits,
      filters,
      setFilters,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
      exportVisits,
      handleImportData,
      importing,
      importInputRef,
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
    ],
  );

  return <VisitsDataContext.Provider value={value}>{children}</VisitsDataContext.Provider>;
}

export function useSaunaVisitsData() {
  const context = useContext(VisitsDataContext);
  if (!context) {
    throw new Error("useSaunaVisitsData must be used within a VisitsDataProvider");
  }
  return context;
}
