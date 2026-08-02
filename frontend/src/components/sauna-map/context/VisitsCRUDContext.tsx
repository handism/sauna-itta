"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useSaunaUIActions } from "./UIContext";

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
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  authenticated: boolean;
  csrfToken: string | null;
  user: ReturnType<typeof useSaunaVisits>["user"];
  dataSource: "local" | "api";
  reload: ReturnType<typeof useSaunaVisits>["reload"];
  logout: ReturnType<typeof useSaunaVisits>["logout"];
}

const VisitsCRUDContext = createContext<VisitsCRUDContextType | null>(null);

export function VisitsCRUDProvider({ children }: { children: ReactNode }) {
  const { showToast } = useSaunaUIActions();

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
    loading,
    saving,
    loadError,
    authenticated,
    csrfToken,
    user,
    dataSource,
    reload,
    logout,
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
      loading,
      saving,
      loadError,
      authenticated,
      csrfToken,
      user,
      dataSource,
      reload,
      logout,
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
      loading,
      saving,
      loadError,
      authenticated,
      csrfToken,
      user,
      dataSource,
      reload,
      logout,
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
