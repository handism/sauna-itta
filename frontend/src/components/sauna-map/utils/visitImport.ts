import { z } from "zod";
import { SaunaVisitSchema, type SaunaVisit } from "../types";
import type { ImportResult } from "../repositories/types";
import { IMPORT_MAX_BATCH_SIZE } from "./apiLimits";
import { isApiImageUrl } from "./image";
import { normalizeVisits, syncLatestFromHistory } from "./visitHistory";

/**
 * 1 リクエストで送る JSON のバイト数の目安。写真は 1 枚最大 1MB（Base64 で約 1.33MB）で
 * 履歴ごとに付くため、件数（IMPORT_MAX_BATCH_SIZE）だけで区切ると 10 件 × 写真数枚で
 * Cloud Run のリクエストサイズ上限（HTTP/1 で 32MiB）を超え、サーバーへ届く前に失敗する。
 * Rails 側の JSON 解析のメモリも抑えるため、上限より十分小さい値にしている。
 * Rails の RequestBodyLimit（24MiB、超えると 413 payload_too_large）よりも小さく保つこと。
 */
export const IMPORT_MAX_BATCH_BYTES = 8 * 1024 * 1024;

const FILE_FORMAT_ERROR_PREFIX = "JSONの読み込みに失敗しました。";

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

export function parseImportText(text: string): SaunaVisit[] {
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

