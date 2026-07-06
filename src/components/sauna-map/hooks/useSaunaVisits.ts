import { useCallback, useState } from "react";
import { VISITS_STORAGE_KEY, getInitialVisits } from "../utils";
import { SaunaVisit } from "../types";
import { useVisitCRUD } from "./useVisitCRUD";
import { useVisitImportExport } from "./useVisitImportExport";

export function useSaunaVisits() {
  const [visits, setVisits] = useState<SaunaVisit[]>(getInitialVisits);

  const saveVisits = useCallback((newVisits: SaunaVisit[]) => {
    setVisits(newVisits);
    try {
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(newVisits));
      return true;
    } catch (error) {
      console.error("Failed to persist visits to localStorage:", error);
      return false;
    }
  }, []);

  const crud = useVisitCRUD(visits, saveVisits);
  const importExport = useVisitImportExport(visits, saveVisits);

  return {
    visits,
    setVisits,
    ...crud,
    ...importExport,
  };
}
