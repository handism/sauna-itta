import { useState } from "react";
import type { SaunaVisit } from "../types";
import { DATA_SOURCE, type VisitRepository } from "../repositories";
import { getInitialVisits } from "../utils";

export function useInitialVisits(injectedRepository?: VisitRepository) {
  // localモードは初期描画を空にしないため同期的に読み込む（ちらつき防止）
  const seededFromStorage = DATA_SOURCE === "local" && !injectedRepository;
  const [visits, setVisits] = useState<SaunaVisit[]>(() =>
    seededFromStorage ? getInitialVisits() : [],
  );

  return { visits, setVisits, seededFromStorage };
}
