import imageCompression from "browser-image-compression";
import { API_ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "./apiLimits";

/**
 * アップロードを受け付ける画像の MIME タイプ。
 *
 * 値は apiLimits.json が唯一の出所で、バックエンドの `VisitHistoryEntry::ALLOWED_IMAGE_TYPES`
 * との一致を Rails のテストが検査している。ここだけ広げると、apiモードではフォームを全部埋めて
 * 保存した時点で初めて「画像形式が許可されていません。」と弾かれ、入力内容が無駄になる。
 */
export const ALLOWED_IMAGE_MIME_TYPES = API_ALLOWED_IMAGE_MIME_TYPES;

/** `<input type="file">` の accept 属性値。`image/*` へ戻すと上記の集合と食い違う */
export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

/**
 * 選択・ドロップされたファイルを受け付けてよいかを判定する。
 * accept 属性はドラッグ&ドロップには効かないため、取り込み側でも必ず通すこと。
 */
export function isAllowedImageFile(file: File): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
}

/**
 * 表示してよい data URL か判定する。SVG はスクリプトを埋め込めるため意図的に除く。
 *
 * ALLOWED_IMAGE_MIME_TYPES より広いのは意図的。こちらは「すでに保存されている値を
 * 描画してよいか」の判定で、過去の版が受け付けた形式 (image/jpg・image/bmp) の記録が
 * localStorage に残っていても表示は続けたい。新しく保存できる形式を変えるときは
 * ALLOWED_IMAGE_MIME_TYPES だけを変えること。
 */
const SAFE_DATA_IMAGE = /^data:image\/(?:jpeg|jpg|png|gif|webp|bmp)[;,]/i;

export function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  /*
   * data URL は先頭だけ見れば判定できるため、URL パーサへ渡さないこと。
   * 圧縮後でも 1MB 級になる Base64 を new URL() に通すと文字列全体の走査と
   * pathname の実体化が走り、一覧の 1 行を描画するたびにその費用を払う
   * （40 件 × 1MB で 23ms → 0.01ms）。
   */
  if (/^data:/i.test(url)) {
    return SAFE_DATA_IMAGE.test(url) ? url : undefined;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch {
    // URL parsing failed, return undefined
  }
  return undefined;
}

/**
 * apiモードの画像エンドポイントの接頭辞。サーバーの `VisitWritable#apply_image` は、
 * この形の値を「保存済みの写真を据え置く」指示として扱い、新しく添付はしない。
 * そのため、この URL のまま書き出した JSON を取り込んでも写真は復元されない。
 */
export const API_IMAGE_PATH_PREFIX = "/api/v1/images/";

export function isApiImageUrl(url: string | undefined): url is string {
  return typeof url === "string" && url.startsWith(API_IMAGE_PATH_PREFIX);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * @param fileType 書き出す形式。省略すると元の形式のまま圧縮する（ライブラリの既定）
 */
export async function compressAndGetBase64(file: File, fileType?: string): Promise<string> {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: MAX_IMAGE_BYTES / (1024 * 1024),
    maxWidthOrHeight: 1024,
    ...(fileType && { fileType }),
  });

  return blobToDataUrl(compressedFile);
}

const BASE64_DATA_URL = /^data:([^;,]+);base64,([\s\S]*)$/i;

/** Base64 の data URL の MIME タイプと復号後のバイト数。それ以外の値は null */
export function describeDataUrlImage(url: string | undefined): { mimeType: string; bytes: number } | null {
  if (!url) return null;
  const match = BASE64_DATA_URL.exec(url);
  if (!match) return null;
  const encoded = match[2].replace(/[\r\n]/g, "");
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  return { mimeType: match[1].toLowerCase(), bytes: Math.floor((encoded.length * 3) / 4) - padding };
}

/**
 * サーバーの `DataUrlImage::PATTERN` と同じ形の data URL。あちらは大文字小文字を区別し、
 * Base64 の文字と改行以外を含む値も拒否するため、ここでも同じ条件で判定する
 * （緩く判定すると `data:IMAGE/JPEG;base64,...` を変換せずに送り、チャンクごと 422 になる）。
 */
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SERVER_ACCEPTED_DATA_URL = new RegExp(
  `^data:(?:${ALLOWED_IMAGE_MIME_TYPES.map(escapeRegExp).join("|")});base64,[A-Za-z0-9+/=\\r\\n]+$`,
);

/**
 * apiモードのサーバー（`DataUrlImage`）が受け付けない data URL の写真か。
 *
 * 過去の版はアップロードの形式を絞っておらず、圧縮ライブラリは BMP を BMP のまま書き出すため、
 * localモードの保存やそのエクスポートに `data:image/bmp` などが残っていることがある
 * （表示は sanitizeImageUrl が続けて許す）。圧縮が上限に届かず 1MB を超えた写真も同様。
 * そのまま取り込むとサーバーはチャンクごと 422 で拒否するため、取り込み前に変換する。
 * data URL でない値（画像 URL など）は対象外。
 */
export function needsImageConversion(url: string | undefined): boolean {
  if (!url || !/^data:/i.test(url)) return false;
  if (!SERVER_ACCEPTED_DATA_URL.test(url)) return true;
  const described = describeDataUrlImage(url);
  return !described || described.bytes > MAX_IMAGE_BYTES;
}

/** 変換後の形式。写真が主のため、透過を保てなくても大きさを抑えられる JPEG にする */
const CONVERTED_IMAGE_TYPE = "image/jpeg";

/**
 * {@link needsImageConversion} が真の写真を、サーバーが受け付ける形式と大きさへ作り直す。
 * 変換できない（復号できない・ブラウザが描画できない・上限に収まらない）ときは reject する。
 */
export async function convertDataUrlImage(url: string): Promise<string> {
  const match = BASE64_DATA_URL.exec(url);
  if (!match) throw new Error("Base64 の data URL ではありません");
  const binary = atob(match[2].replace(/[\r\n]/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // `data:IMAGE/PNG` のような大文字の MIME もブラウザが画像として読めるよう小文字にそろえる
  const file = new File([bytes], "imported-image", { type: match[1].toLowerCase() });
  const converted = await compressAndGetBase64(file, CONVERTED_IMAGE_TYPE);
  if (needsImageConversion(converted)) throw new Error("写真をサーバーの受け付ける形式へ変換できませんでした");
  return converted;
}
