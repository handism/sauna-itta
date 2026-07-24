"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  ChangeEvent,
  RefObject,
} from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useVisitFilters } from "../hooks/useVisitFilters";
import { useSaunaUI } from "./UIContext";
import { SaunaVisit } from "../types";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

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
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const {
    visits,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    importVisitsFromFile,
    exportVisits,
  } = useSaunaVisits();

  const {
    filters,
    setFilters,
    filteredVisits,
    stats,
    isFilterActive,
    activeFilterCount,
    clearFilters,
  } = useVisitFilters(visits);

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, success } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast("新しく追加されるデータはありませんでした。", "info");
          return;
        }

        if (!success) {
          showToast(STORAGE_ERROR_MSG, "error");
        } else {
          showToast(`データを${added}件取り込みました。`, "success");
        }
      } catch (error) {
        console.error(error);
        showToast("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

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
