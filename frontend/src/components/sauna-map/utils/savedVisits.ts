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

export function loadSavedVisits(): SavedVisits {

  if (typeof window === "undefined") {
    return loadBundledVisits();
  }

  const savedVisits = readStorage(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return loadBundledVisits();
  }

  try {
    const parsedSaved = JSON.parse(savedVisits);
    if (!Array.isArray(parsedSaved)) {
      return loadBundledVisits();
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
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return loadBundledVisits();
  }
}
