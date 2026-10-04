import { Dispatch, SetStateAction, useEffect } from "react";
import { LatLng, VisitFormState } from "../types";
import { reverseGeocodeArea } from "../utils/geocoding";

/**
 * 場所を選んでから問い合わせるまでの待ち時間。地図を続けてクリックしたときは最後の 1 回だけを送り、
 * 公共 Nominatim の利用方針（1 秒に 1 回まで）を守る。
 */
export const AREA_LOOKUP_DELAY_MS = 1000;

/**
 * 地図で選んだ場所からエリア欄（都道府県＋市区町村）を補う。
 *
 * 地点検索から選んだときは `fillFormFromPlace()` がエリアを埋めるが、地図のクリックだけで
 * 場所を選ぶとエリアが空のまま保存され、統計の都道府県集計に載らない。
 * 利用者が入力したエリアは上書きしないため、エリアが空のあいだだけ問い合わせる
 * （入力を始めたら待機中の問い合わせを取り消す）。
 *
 * @param enabled 新規登録のときだけ true にする。既存の記録を開いただけでエリアが書き換わり、
 *   利用者の意図しない変更が保存されるのを避けるため
 */
export function useAreaFromLocation(
  location: LatLng | null,
  enabled: boolean,
  setForm: Dispatch<SetStateAction<VisitFormState>>,
) {
  useEffect(() => {
    if (!enabled || !location) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const area = await reverseGeocodeArea(location.lat, location.lng, controller.signal);
      if (!area || controller.signal.aborted) return;
      setForm((prev) => (prev.area.trim() ? prev : { ...prev, area }));
    }, AREA_LOOKUP_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, location, setForm]);
}
