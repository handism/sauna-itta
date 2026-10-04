import { SaunaVisit, VisitFormState, VisitFormInputSchema } from "../types";
import { getVisitHistoryEntries } from "./visitHistory";
import { getVisitStatus } from "./visitStatus";
import { getTodayDate } from "./date";

export function getDefaultForm(date = ""): VisitFormState {
  return {
    name: "",
    comment: "",
    image: "",
    date,
    rating: 0,
    tagsText: "",
    status: "visited",
    area: "",
    appendHistory: false,
  };
}

export function toFormState(visit: SaunaVisit): VisitFormState {
  const history = getVisitHistoryEntries(visit);
  const latest = history[history.length - 1];
  return {
    name: visit.name,
    comment: latest?.comment ?? visit.comment ?? "",
    image: latest?.image ?? visit.image ?? "",
    date: latest?.date ?? visit.date,
    rating: latest?.rating ?? visit.rating ?? 0,
    tagsText: (visit.tags ?? []).join(", "),
    status: getVisitStatus(visit),
    area: visit.area ?? "",
    appendHistory: false,
  };
}

/**
 * 「また行った」「行った！」から開くフォームの初期値。
 *
 * 再訪のたびに編集を開いて「新しい訪問を追加」へ切り替え、日付・感想・評価を消して
 * 入れ直す手間を省くため、今日の訪問を書く状態で開く。行きたい記録は履歴に訪問が
 * 無いので、履歴の末尾（行きたい時点の内容）を書き換える（追加すると訪問回数が 2 から始まる）。
 * サウナ名・エリア・タグは施設の情報なので引き継ぐ。
 */
export function toRevisitFormState(visit: SaunaVisit): VisitFormState {
  return {
    ...toFormState(visit),
    comment: "",
    image: "",
    date: getTodayDate(),
    rating: 0,
    status: "visited",
    appendHistory: getVisitStatus(visit) === "visited",
  };
}

export function toNormalizedTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export type VisitFormValidationResult =
  | { success: true; data: VisitFormState }
  | { success: false; errors: string[] };

export function validateVisitForm(form: VisitFormState): VisitFormValidationResult {
  const result = VisitFormInputSchema.safeParse(form);
  if (result.success) {
    return { success: true, data: form };
  }
  const errors = result.error.issues.map((issue) => issue.message);
  return { success: false, errors };
}

/**
 * 保存ボタンが非活性となる理由（バリデーションや画像処理状態によるブロック理由）を返す。
 * すべてクリアしている場合は null を返す。
 */
export function getSubmitBlockedReason(
  selectedLocation: { lat: number; lng: number } | null | undefined,
  name: string | undefined,
  imageUploading: boolean,
): string | null {
  if (!selectedLocation) {
    return "地図上をクリックして場所を選択してください";
  }
  if (!name || !name.trim()) {
    return "サウナ名を入力してください";
  }
  if (imageUploading) {
    return "画像の処理が終わるまでお待ちください";
  }
  return null;
}

/**
 * 保存の前に利用者が入力すべき箇所。{@link getSubmitBlockedReason} のうち、
 * 待てば解消する理由（画像の処理中）を除いたもの。保存ボタンを押したときの案内先に使う。
 */
export function getSubmitFixTarget(
  selectedLocation: { lat: number; lng: number } | null | undefined,
  name: string | undefined,
): "location" | "name" | null {
  if (!selectedLocation) return "location";
  if (!name || !name.trim()) return "name";
  return null;
}

/**
 * 地点検索の結果からサウナ名・エリアを補う。利用者がすでに入力した値は上書きしない。
 * 登録フォームの検索欄と、モバイルの場所選択中の検索欄（MobilePinHint）で共有する。
 */
export function fillFormFromPlace(
  form: VisitFormState,
  place: { name: string; addressText: string },
): VisitFormState {
  return {
    ...form,
    name: form.name ? form.name : place.name,
    area: form.area ? form.area : place.addressText,
  };
}
