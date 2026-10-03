import { useState, useRef, useCallback, ChangeEvent } from "react";
import { z } from "zod";
import { SaunaVisit, SaunaVisitSchema } from "../types";
import { IMPORT_MAX_BATCH_SIZE, isApiImageUrl, normalizeVisits, syncLatestFromHistory } from "../utils";
import { toUserMessage, type ImportResult } from "../repositories";
import type { ShowToast } from "../components/common/Toast";

/**
 * 1 リクエストで送る JSON のバイト数の目安。写真は 1 枚最大 1MB（Base64 で約 1.33MB）で
 * 履歴ごとに付くため、件数（IMPORT_MAX_BATCH_SIZE）だけで区切ると 10 件 × 写真数枚で
 * Cloud Run のリクエストサイズ上限（HTTP/1 で 32MiB）を超え、サーバーへ届く前に失敗する。
 * Rails 側の JSON 解析のメモリも抑えるため、上限より十分小さい値にしている。
 */
export const IMPORT_MAX_BATCH_BYTES = 8 * 1024 * 1024;

const FILE_FORMAT_ERROR_PREFIX = "JSONの読み込みに失敗しました。";

const REVOKE_OBJECT_URL_DELAY_MS = 1000;

const RELOAD_FAILED_NOTE = "（画面の再読み込みに失敗したため、表示が最新でない可能性があります）";

const EXPORT_FAILED_FALLBACK = "エクスポートに失敗しました。";

export interface BatchImportResult extends ImportResult {
  /** 取り込み後の再読み込みに成功したか。失敗しても取り込み自体は確定している */
  reloaded: boolean;
  /** 画像エンドポイントの URL だったため取り込めなかった写真の枚数（dropApiImageUrls 参照） */
  droppedImages: number;
}

export class ImportProgressError extends Error {
  constructor(
    readonly added: number,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ImportProgressError";
  }
}

/**
 * 取り込むファイル自体の問題（読み込めない・JSON でない・記録の形式でない）。
 * message はそのまま利用者へ出す文言で、どこを直せばよいかを含める。
 * Repository の失敗（ImportProgressError）とは分けること（ルートの AGENTS.md 参照）。
 */
export class ImportFileError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImportFileError";
  }
}

/** zod の最初の問題箇所を「3件目の記録の「lat」」のような利用者向けの文言にする */
function describeSchemaError(error: z.ZodError): string {
  const [issue] = error.issues;
  const [index, ...fieldPath] = issue?.path ?? [];
  if (typeof index !== "number") {
    return "サウナ記録の配列ではありません。エクスポートしたファイルを指定してください。";
  }
  const field = fieldPath.map(String).join(".");
  const location = field ? `${index + 1}件目の記録の「${field}」` : `${index + 1}件目の記録`;
  const others = error.issues.length > 1 ? `（ほかに${error.issues.length - 1}か所）` : "";
  return `${location}の形式が正しくありません${others}。`;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export async function parseImportFile(file: File): Promise<SaunaVisit[]> {
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch (error) {
    throw new ImportFileError(`${FILE_FORMAT_ERROR_PREFIX}ファイルを読み込めませんでした。`, { cause: error });
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ImportFileError(
      `${FILE_FORMAT_ERROR_PREFIX}JSON形式ではありません。エクスポートしたファイルを指定してください。`,
      { cause: error },
    );
  }

  const validationResult = z.array(SaunaVisitSchema).safeParse(parsed);
  if (!validationResult.success) {
    throw new ImportFileError(`${FILE_FORMAT_ERROR_PREFIX}${describeSchemaError(validationResult.error)}`, {
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

export function filterNewVisits(validVisits: SaunaVisit[], existingVisits: SaunaVisit[]): { normalizedImported: SaunaVisit[]; alreadyKnown: number } {
  const existingIds = new Set(existingVisits.map((v) => v.id));
  const normalizedImported = normalizeVisits(validVisits.filter((v) => !existingIds.has(v.id)));
  // 画面に出ている記録と重複した分。サーバー側で弾かれた分は importBatch の skipped に乗る
  const alreadyKnown = validVisits.length - normalizedImported.length;
  return { normalizedImported, alreadyKnown };
}

/**
 * 写真が apiモードの画像エンドポイントの URL のままになっている履歴から、写真だけを外す。
 * 以前の版の apiモードのエクスポートはこの形で書き出していた。サーバーはこの URL を
 * 「既存の写真を据え置く」指示として扱い新しい記録には添付せず、localモードでは
 * 表示できない相対 URL として残るため、どちらのモードでも外したうえで枚数を利用者へ伝える。
 *
 * @param visits normalizeVisits 済みの記録（history を必ず持つ）
 */
export function dropApiImageUrls(visits: SaunaVisit[]): { visits: SaunaVisit[]; droppedImages: number } {
  let droppedImages = 0;
  const cleaned = visits.map((visit) => {
    const history = visit.history ?? [];
    if (!history.some((entry) => isApiImageUrl(entry.image))) return visit;

    const nextHistory = history.map((entry) => {
      if (!isApiImageUrl(entry.image)) return entry;
      droppedImages += 1;
      return { ...entry, image: undefined };
    });
    return { ...visit, ...syncLatestFromHistory(nextHistory, visit.visitCount) };
  });
  return { visits: cleaned, droppedImages };
}

/**
 * 取り込む記録を、件数（maxCount）と JSON のバイト数（maxBytes）の両方の上限で区切る。
 * 1 件だけで maxBytes を超える記録は分割できないため、単独のチャンクとして送る。
 */
export function chunkVisitsForImport(
  visits: SaunaVisit[],
  maxCount: number = IMPORT_MAX_BATCH_SIZE,
  maxBytes: number = IMPORT_MAX_BATCH_BYTES,
): SaunaVisit[][] {
  const encoder = new TextEncoder();
  const chunks: SaunaVisit[][] = [];
  let current: SaunaVisit[] = [];
  let currentBytes = 0;
  for (const visit of visits) {
    const bytes = encoder.encode(JSON.stringify(visit)).byteLength;
    if (current.length > 0 && (current.length >= maxCount || currentBytes + bytes > maxBytes)) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(visit);
    currentBytes += bytes;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
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
  showToast?: ShowToast,
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
        showToast?.(`${added}/${total}件を取り込み中です...`, "info");
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

/**
 * @param getVisits 画面に表示中の記録を返す関数。重複判定とエクスポートの時点で読む
 *   （配列を直接受け取ると、返す操作関数が記録の変化ごとに作り直される）
 * @param importBatch Repository の importBatch。両モードともこれが唯一の保存経路のため必須。
 *   「Repository を通さず visits 配列を丸ごと保存する」引数を足し戻さないこと
 *   （localモードでも Repository 経由に統一されています。frontend/AGENTS.md 参照）。
 * @param prepareExport Repository の prepareExport。apiモードの写真を data URL へ置き換える。
 *   省略可能にしたり記録をそのまま書き出したりすると、apiモードのエクスポートから写真が抜ける。
 */
export function useVisitImportExport(
  getVisits: () => SaunaVisit[],
  importBatch: (visits: SaunaVisit[]) => Promise<ImportResult>,
  prepareExport: (visits: SaunaVisit[]) => Promise<SaunaVisit[]>,
  reload: () => Promise<boolean>,
  showToast?: ShowToast,
) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const importVisitsFromFile = useCallback(
    async (file: File): Promise<BatchImportResult> => {
      const validVisits = await parseImportFile(file);
      const { normalizedImported, alreadyKnown } = filterNewVisits(validVisits, getVisits());

      if (normalizedImported.length === 0) {
        return { added: 0, skipped: alreadyKnown, reloaded: true, droppedImages: 0 };
      }

      const { visits: importable, droppedImages } = dropApiImageUrls(normalizedImported);
      const result = await performBatchImport(importable, alreadyKnown, importBatch, reload, showToast);
      return { ...result, droppedImages };
    },
    [getVisits, importBatch, reload, showToast],
  );

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, skipped, reloaded, droppedImages } = await importVisitsFromFile(file);
        const reloadNote = reloaded ? "" : RELOAD_FAILED_NOTE;
        if (added === 0) {
          showToast?.(
            (skipped > 0
              ? `${skipped}件はすでに登録済みのため、新しく追加されたデータはありません。`
              : "新しく追加されるデータはありませんでした。") + reloadNote,
            "info",
          );
          return;
        }

        const skippedNote = skipped > 0 ? `（${skipped}件はすでに登録済みのためスキップしました）` : "";
        const droppedNote =
          droppedImages > 0
            ? `（写真${droppedImages}枚は画像URLとして書き出されていたため取り込めませんでした。最新の版でエクスポートし直してください）`
            : "";
        showToast?.(`データを${added}件取り込みました。${skippedNote}${droppedNote}${reloadNote}`, "success");
      } catch (error) {
        if (error instanceof ImportProgressError) {
          const progress = error.added > 0 ? `${error.added}件は取り込み済みです。` : "";
          showToast?.(`データの取り込みに失敗しました。${progress}${error.message}`, "error");
        } else if (error instanceof ImportFileError) {
          showToast?.(error.message, "error");
        } else {
          // parseImportFile と performBatchImport は上の 2 種類で投げるため、ここへ来るのは想定外の誤りだけ
          console.error("Unexpected import failure:", error);
          showToast?.("データの取り込みに失敗しました。", "error");
        }
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

  const exportVisits = useCallback(async () => {
    setExporting(true);
    try {
      downloadVisitsAsJson(await prepareExport(getVisits()));
    } catch (error) {
      showToast?.(toUserMessage(error, EXPORT_FAILED_FALLBACK), "error");
    } finally {
      setExporting(false);
    }
  }, [getVisits, prepareExport, showToast]);

  return {
    importing,
    exporting,
    importInputRef,
    handleImportData,
    importVisitsFromFile,
    exportVisits,
  };
}
