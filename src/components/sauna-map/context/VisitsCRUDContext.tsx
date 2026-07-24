"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useSaunaUI } from "./UIContext";

interface VisitsCRUDContextType {
  visits: import("../types").SaunaVisit[];
  addVisit: ReturnType<typeof useSaunaVisits>["addVisit"];
  editVisit: ReturnType<typeof useSaunaVisits>["editVisit"];
  deleteVisit: ReturnType<typeof useSaunaVisits>["deleteVisit"];
  removeHistoryEntry: ReturnType<typeof useSaunaVisits>["removeHistoryEntry"];
  exportVisits: ReturnType<typeof useSaunaVisits>["exportVisits"];
  handleImportData: ReturnType<typeof useSaunaVisits>["handleImportData"];
  importing: boolean;
  importInputRef: ReturnType<typeof useSaunaVisits>["importInputRef"];
}

const VisitsCRUDContext = createContext<VisitsCRUDContextType | null>(null);

export function VisitsCRUDProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo(
    () => ({
      visits,
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
      exportVisits,
      handleImportData,
      importing,
      importInputRef,
    }),
    [
      visits,
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
      exportVisits,
      handleImportData,
      importing,
      importInputRef,
    ],
  );

  return (
    <VisitsCRUDContext.Provider value={value}>
      {children}
    </VisitsCRUDContext.Provider>
  );
}

export function useVisitsCRUD() {
  const ctx = useContext(VisitsCRUDContext);
  if (!ctx)
    throw new Error("useVisitsCRUD must be used within VisitsCRUDProvider");
  return ctx;
}
