import { SaunaVisit, VisitFormState, VisitFormInputSchema } from "../types";
import { getVisitHistoryEntries } from "./visitHistory";
import { getVisitStatus } from "./visitStatus";

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

