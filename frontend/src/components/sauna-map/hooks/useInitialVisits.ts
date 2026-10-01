import { useState } from "react";
import type { SaunaVisit } from "../types";
import { DATA_SOURCE, type VisitRepository } from "../repositories";
import { loadSavedVisits } from "../utils";

export function useInitialVisits(injectedRepository?: VisitRepository) {
  // localモードは初期描画を空にしないため同期的に読み込む（ちらつき防止）
  const seededFromStorage = DATA_SOURCE === "local" && !injectedRepository;
  const [initial] = useState(() =>
    seededFromStorage ? loadSavedVisits() : { visits: [], unreadable: [] },
  );
  const [visits, setVisits] = useState<SaunaVisit[]>(initial.visits);

  return { visits, setVisits, seededFromStorage, unreadableCount: initial.unreadable.length };
}
