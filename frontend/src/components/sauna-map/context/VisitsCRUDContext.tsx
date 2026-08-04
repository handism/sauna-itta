"use client";

import { createContext, useContext, useMemo, ReactNode, ChangeEvent, RefObject } from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useSaunaUIActions } from "./UIContext";
import type { SaunaVisit, LatLng, VisitFormState } from "../types";
import type { SessionUser } from "../repositories";

interface VisitsCRUDContextType {
  visits: SaunaVisit[];
  addVisit: (location: LatLng, form: VisitFormState) => Promise<{ success: boolean; newVisit?: SaunaVisit }>;
  editVisit: (id: string, location: LatLng, form: VisitFormState) => Promise<{ success: boolean }>;
  deleteVisit: (id: string) => Promise<{ success: boolean }>;
  removeHistoryEntry: (id: string, index: number) => Promise<{ success: boolean }>;
  exportVisits: () => void;
  handleImportData: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  importing: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  authenticated: boolean;
  csrfToken: string | null;
  user: SessionUser | null;
  dataSource: "local" | "api";
  reload: () => Promise<void>;
  logout: () => Promise<void>;
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
