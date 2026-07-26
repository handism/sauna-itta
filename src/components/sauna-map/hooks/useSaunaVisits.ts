import { useCallback, useState } from "react";
import { VISITS_STORAGE_KEY, getInitialVisits, writeStorage } from "../utils";
import { SaunaVisit } from "../types";
import { useVisitCRUD } from "./useVisitCRUD";
import { useVisitImportExport } from "./useVisitImportExport";

export function useSaunaVisits(
  showToast?: (message: string, type: "success" | "error" | "info") => void
) {
  const [visits, setVisits] = useState<SaunaVisit[]>(getInitialVisits);

  const saveVisits = useCallback((newVisits: SaunaVisit[]) => {
    setVisits(newVisits);
    // 保存できたかは呼び出し側が「画像が大きすぎる」等の通知に使う
    return writeStorage(VISITS_STORAGE_KEY, JSON.stringify(newVisits));
  }, []);

  const crud = useVisitCRUD(visits, saveVisits);
  const importExport = useVisitImportExport(visits, saveVisits, showToast);

  return {
    visits,
    setVisits,
    ...crud,
    ...importExport,
  };
}
