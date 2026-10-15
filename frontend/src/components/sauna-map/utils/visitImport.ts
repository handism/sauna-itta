import { z } from "zod";
import { SaunaVisitSchema, VisitHistoryEntrySchema, type SaunaVisit } from "../types";
import type { ImportResult } from "../repositories/types";
import { IMPORT_MAX_BATCH_SIZE } from "./apiLimits";
import { isValidDateString } from "./date";
import { convertDataUrlImage, isApiImageUrl, needsImageConversion } from "./image";
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
  /** 対応していない形式・大きさで、変換もできなかったため外した写真の枚数（convertUnsupportedImages 参照） */
  unconvertibleImages: number;
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

/*
 * 取り込むファイルの検証。保存値の検証（SaunaVisitSchema）より厳しく、apiモードのサーバー
 * （SaunaVisit / VisitHistoryEntry の検証と DB の制約）が拒否する値をここで弾く。
 * サーバーは不正な記録を含むチャンクごと 422 で拒否し、どの記録のどの項目かが伝わらないうえ、
 * localモードは不正な値をそのまま保存してしまうため。
 * SaunaVisitSchema 自体を厳しくしないこと（保存済みの記録が「読めない記録」として表示から外れる）。
 */
const notBlank = (value: string) => value.trim() !== "";
// 空文字はサーバーが今日の日付として扱うため受け付ける（以前の版の保存値との互換）
const importDate = z.string().refine((value) => value === "" || isValidDateString(value));
const importRating = z.number().min(0).max(5);

const ImportHistoryEntrySchema = VisitHistoryEntrySchema.extend({
  date: importDate,
  rating: importRating.optional(),
});

const ImportVisitSchema = SaunaVisitSchema.extend({
  id: z.string().refine(notBlank),
  name: z.string().refine(notBlank),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  date: importDate,
  rating: importRating.optional(),
  visitCount: z.number().int().nonnegative().optional(),
  history: z.array(ImportHistoryEntrySchema).optional(),
});

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

  const validationResult = z.array(ImportVisitSchema).safeParse(parsed);
  if (!validationResult.success) {
    throw new ImportFileError(`${FILE_FORMAT_ERROR_PREFIX}${describeSchemaError(validationResult.error)}`, {
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

/**
 * 取り込む記録を選ぶ。画面に出ている記録と同じ ID と、ファイルの中で先に出てきた記録と同じ ID は
 * 除外する（apiモードのサーバーも同じ ID の 2 件目以降をスキップするため、localモードもそれに揃える。
 * 除外しないと localモードでは同じ ID の記録が 2 件保存される）。
 *
 * 取り込む記録の中で履歴 ID が重複していれば ImportFileError を投げる。apiモードのサーバーは
 * 記録内で一意の履歴 ID（public_id）の重複をチャンクごと 422 で拒否し、どの記録か伝わらない一方、
 * localモードはそのまま保存してしまうため、送る前にファイルの問題として伝える。
 * 除外する記録は取り込まないため検査しない（過去に取り込んだ記録が重複を含んでいても、
 * そのバックアップを取り込み直せるようにする）。
 */
export function filterNewVisits(validVisits: SaunaVisit[], existingVisits: SaunaVisit[]): { normalizedImported: SaunaVisit[]; alreadyKnown: number } {
  const seenIds = new Set(existingVisits.map((v) => v.id));
  const newVisits: SaunaVisit[] = [];
  for (const [index, visit] of validVisits.entries()) {
    if (seenIds.has(visit.id)) continue;
    seenIds.add(visit.id);
    assertUniqueHistoryIds(visit, index);
    newVisits.push(visit);
  }
  const normalizedImported = normalizeVisits(newVisits);
  // 画面に出ている記録・ファイル内の先の記録と重複した分。サーバー側で弾かれた分は importBatch の skipped に乗る
  const alreadyKnown = validVisits.length - normalizedImported.length;
  return { normalizedImported, alreadyKnown };
}

function assertUniqueHistoryIds(visit: SaunaVisit, index: number): void {
  const seen = new Set<string>();
  for (const entry of visit.history ?? []) {
    if (entry.id === undefined || entry.id === "") continue;
    if (seen.has(entry.id)) {
      throw new ImportFileError(
        `${FILE_FORMAT_ERROR_PREFIX}${index + 1}件目の記録の「history」に同じID（${entry.id}）の履歴が複数あります。`,
      );
    }
    seen.add(entry.id);
  }
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
 * apiモードのサーバーが受け付けない形式・大きさの写真（needsImageConversion）を、
 * 受け付ける形式へ変換する。変換できない写真は外し、枚数を返す。
 *
 * サーバーは不正な写真を含む記録をチャンクごと 422 で拒否し、どの記録が原因かも伝わらないため、
 * 送る前に直す。localモードでも同じく変換する（取り込んだ記録をモード間で同じ内容にするため。
 * 変換後の JPEG はどちらのモードでも表示できる）。
 *
 * @param visits normalizeVisits 済みの記録（history を必ず持つ）
 * @param convert 写真 1 枚の変換。テストで差し替えるための引数
 */
export async function convertUnsupportedImages(
  visits: SaunaVisit[],
  convert: (dataUrl: string) => Promise<string> = convertDataUrlImage,
): Promise<{ visits: SaunaVisit[]; unconvertibleImages: number }> {
  let unconvertibleImages = 0;
  // 写真は 1 枚ずつ変換する（並べると、大きな写真を何枚も同時にデコードしてメモリを圧迫する）
  const cleaned: SaunaVisit[] = [];
  for (const visit of visits) {
    const history = visit.history ?? [];
    if (!history.some((entry) => needsImageConversion(entry.image))) {
      cleaned.push(visit);
      continue;
    }

    const nextHistory = [];
    for (const entry of history) {
      if (!entry.image || !needsImageConversion(entry.image)) {
        nextHistory.push(entry);
        continue;
      }
      try {
        nextHistory.push({ ...entry, image: await convert(entry.image) });
      } catch (error) {
        console.error(`取り込む写真を変換できませんでした (記録ID: ${visit.id}):`, error);
        unconvertibleImages += 1;
        nextHistory.push({ ...entry, image: undefined });
      }
    }
    cleaned.push({ ...visit, ...syncLatestFromHistory(nextHistory, visit.visitCount) });
  }
  return { visits: cleaned, unconvertibleImages };
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

