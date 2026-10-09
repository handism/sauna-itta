import type { SaunaVisit } from "../types";
import { toUserMessage } from "../repositories/errorMessages";
import type { ImportResult } from "../repositories/types";
import {
  ImportFileError,
  ImportProgressError,
  parseImportText,
  filterNewVisits,
  dropApiImageUrls,
  chunkVisitsForImport,
  type BatchImportResult,
} from "../utils/visitImport";

const REVOKE_OBJECT_URL_DELAY_MS = 1000;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("ファイルを読み込めませんでした"));
    reader.readAsText(file);
  });
}

export async function parseImportFile(file: File): Promise<SaunaVisit[]> {
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch (error) {
    throw new ImportFileError("JSONの読み込みに失敗しました。ファイルを読み込めませんでした。", { cause: error });
  }

  return parseImportText(text);
}

/**
 * 取り込みは Repository の importBatch へ委ねる（localモードは localStorage、
 * apiモードは Rails への POST）。保存の失敗は例外で伝わるため、戻り値に成否は持たせない。
 *
 * @param reload 失敗を例外ではなく戻り値 (false) で返す（useVisitSession の reload）。
 *   try/catch で再読み込みの失敗を拾う形へ戻すと、その分岐は本番で一度も通らない。
 */
export async function performBatchImport(
  normalizedImported: SaunaVisit[],
  alreadyKnown: number,
  importBatch: (visits: SaunaVisit[]) => Promise<ImportResult>,
  reload: () => Promise<boolean>,
  onProgress?: (added: number, total: number) => void,
): Promise<Omit<BatchImportResult, "droppedImages">> {
  let added = 0;
  let skipped = alreadyKnown;
  try {
    const total = normalizedImported.length;
    const chunks = chunkVisitsForImport(normalizedImported);
    for (const [index, chunk] of chunks.entries()) {
      const result = await importBatch(chunk);
      added += result.added;
      skipped += result.skipped;
      // 最終チャンクの結果は完了トーストで伝えるため、残りがある間だけ途中経過を出す
      if (index < chunks.length - 1) {
        onProgress?.(added, total);
      }
    }
  } catch (error) {
    // 楽観ロックの競合（conflict）は他の保存操作と同じ案内へ変換する（toUserMessage 参照）
    let message = toUserMessage(error, "サーバーへの取り込みに失敗しました。");
    if (!(await reload())) {
      message += "（再読み込みにも失敗しました）";
    }
    throw new ImportProgressError(added, message, { cause: error });
  }
  const reloaded = await reload();
  return { added, skipped, reloaded };
}

export function downloadVisitsAsJson(visits: SaunaVisit[]): void {
  // 写真は最大1MBのBase64として記録に含まれるため、数十件で data: URL の
  // 長さ上限を超えて無言で失敗する。Blob URL なら容量の制約を受けない。
  const blob = new Blob([JSON.stringify(visits, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", objectUrl);
  linkElement.setAttribute("download", "sauna-visits.json");
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  // click() 直後の解放はダウンロード開始前に URL を無効化するブラウザがあるため遅らせる
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_OBJECT_URL_DELAY_MS);
}

/** ファイルの検証から取り込みまでを実行する。既存記録はファイル検証後の最新値で判定する。 */
export async function importVisitsFromFile(
  file: File,
  getVisits: () => SaunaVisit[],
  importBatch: (visits: SaunaVisit[]) => Promise<ImportResult>,
  reload: () => Promise<boolean>,
  onProgress?: (added: number, total: number) => void,
): Promise<BatchImportResult> {
  const validVisits = await parseImportFile(file);
  const { normalizedImported, alreadyKnown } = filterNewVisits(validVisits, getVisits());
  if (normalizedImported.length === 0) {
    return { added: 0, skipped: alreadyKnown, reloaded: true, droppedImages: 0 };
  }
  const { visits: importable, droppedImages } = dropApiImageUrls(normalizedImported);
  const result = await performBatchImport(importable, alreadyKnown, importBatch, reload, onProgress);
  return { ...result, droppedImages };
}
