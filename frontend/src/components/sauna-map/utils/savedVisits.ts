import { z } from "zod";
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit, SaunaVisitSchema } from "../types";
import { VISITS_STORAGE_KEY } from "./constants";
import { readStorage } from "./storage";
import { normalizeVisits } from "./visitHistory";

/*
 * localモードの保存済み記録の読み込み。localStorage への書き込みは
 * LocalVisitRepository が行い、ここは起動時の復元だけを受け持つ。
 */

export interface SavedVisits {
  visits: SaunaVisit[];
  /**
   * 保存されていたが検証に通らなかった要素（生の値のまま）。
   * 画面には出さないが、保存し直すときは必ず書き戻すこと（`LocalVisitRepository.persist` 参照）。
   * 捨てたまま保存すると、読めなかった記録が localStorage から完全に消える。
   */
  unreadable: unknown[];
}

/**
 * 同梱JSON（保存がまだ無いときの初期データ）。約1,600行あり zod の検証も軽くないため、
 * 保存がある通常の起動では読まないよう、必要になったときだけ呼ぶこと。
 */
function loadBundledVisits(): SavedVisits {
  const parsedInitial = z.array(SaunaVisitSchema).safeParse(initialVisits);
  const rawBaseVisits = parsedInitial.success ? parsedInitial.data : [];
  return { visits: normalizeVisits(rawBaseVisits), unreadable: [] };
}

/**
 * 保存値そのものが読めない（JSONとして壊れている・配列でない）ときは、表示は同梱JSONへ
 * 切り替えつつ、生の保存値を unreadable の 1 要素として返す。空の unreadable を返すと、
 * 次の保存で LocalVisitRepository.persist が壊れた保存値を同梱JSONで上書きし、
 * 要素単位では残している読めない記録が、保存値全体が壊れたときだけ完全に失われる。
 */
function loadBundledVisitsKeeping(raw: unknown): SavedVisits {
  return { ...loadBundledVisits(), unreadable: [raw] };
}

export function loadSavedVisits(): SavedVisits {

  if (typeof window === "undefined") {
    return loadBundledVisits();
  }

  const savedVisits = readStorage(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return loadBundledVisits();
  }

  let parsedSaved: unknown;
  try {
    parsedSaved = JSON.parse(savedVisits);
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    // 文字列のまま残す（JSONとして読めないため、手で復旧できる形を崩さない）
    return loadBundledVisitsKeeping(savedVisits);
  }
  if (!Array.isArray(parsedSaved)) {
    return loadBundledVisitsKeeping(parsedSaved);
  }

  // 高速な一括検証を実施。一部無効な要素が含まれる場合のみ要素ごとに振り分ける
  const batchResult = z.array(SaunaVisitSchema).safeParse(parsedSaved);
  const validSaved: SaunaVisit[] = [];
  const unreadable: unknown[] = [];
  if (batchResult.success) {
    validSaved.push(...batchResult.data);
  } else {
    for (const item of parsedSaved) {
      const result = SaunaVisitSchema.safeParse(item);
      if (result.success) validSaved.push(result.data);
      else unreadable.push(item);
    }
  }

  /*
   * 保存があるときは保存側だけを正とする。同梱JSONを毎回足し戻す実装に戻すと、
   * デモ記録の編集・削除が保存直後は反映されるのに再読み込みで元へ戻ります
   * （保存側の同一IDが捨てられ、削除した記録も同梱JSONから復活するため）。
   * 同梱JSONは保存がまだ無いときの初期データとしてのみ使うこと。
   */
  return { visits: normalizeVisits(validSaved), unreadable };
}
