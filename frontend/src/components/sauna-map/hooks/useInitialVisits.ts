import { useState } from "react";
import type { SaunaVisit } from "../types";
import { loadSavedVisits } from "../utils";

/**
 * @param seedFromStorage localStorage から同期的に初期値を読むか。判定は呼び出し側
 *   （useSaunaVisits）が使う Repository の dataSource に合わせること。ここで DATA_SOURCE を
 *   別に参照すると、Repository と初期値の出所が食い違ったときに気付けない。
 */
export function useInitialVisits(seedFromStorage: boolean) {
  // localモードは初期描画を空にしないため同期的に読み込む（ちらつき防止）
  const [initial] = useState(() =>
    seedFromStorage ? loadSavedVisits() : { visits: [], unreadable: [] },
  );
  const [visits, setVisits] = useState<SaunaVisit[]>(initial.visits);

  return { visits, setVisits, unreadableCount: initial.unreadable.length };
}
