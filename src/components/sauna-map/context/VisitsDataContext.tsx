"use client";

export { useVisitsCRUD } from "./VisitsCRUDContext";
export { useVisitFiltersContext } from "./VisitFiltersContext";
import { VisitsCRUDProvider } from "./VisitsCRUDContext";
import { VisitFiltersProvider } from "./VisitFiltersContext";

// 後方互換用に旧 API を提供するラッパーをここで用意する。
// 既存コードは `useSaunaVisitsData` を期待しているため、CRUD + Filters を組み合わせて返す。
import { useVisitsCRUD } from "./VisitsCRUDContext";
import { useVisitFiltersContext } from "./VisitFiltersContext";

export function VisitsDataProvider({ children }: { children: any }) {
  return (
    <VisitsCRUDProvider>
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    </VisitsCRUDProvider>
  );
}

export function useSaunaVisitsData() {
  const crud = useVisitsCRUD();
  const filters = useVisitFiltersContext();

  return {
    // CRUD
    visits: crud.visits,
    addVisit: crud.addVisit,
    editVisit: crud.editVisit,
    deleteVisit: crud.deleteVisit,
    removeHistoryEntry: crud.removeHistoryEntry,
    exportVisits: crud.exportVisits,
    handleImportData: crud.handleImportData,
    importing: crud.importing,
    importInputRef: crud.importInputRef,
    // Filters / derived
    filters: filters.filters,
    setFilters: filters.setFilters,
    filteredVisits: filters.filteredVisits,
    stats: filters.stats,
    isFilterActive: filters.isFilterActive,
    activeFilterCount: filters.activeFilterCount,
    clearFilters: filters.clearFilters,
  };
}
