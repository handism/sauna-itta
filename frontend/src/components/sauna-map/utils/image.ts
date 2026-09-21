import imageCompression from "browser-image-compression";

/**
 * アップロードを受け付ける画像の MIME タイプ。
 *
 * バックエンドの `VisitHistoryEntry::ALLOWED_IMAGE_TYPES` と同じ集合を保つこと。
 * ここだけ広げると、apiモードではフォームを全部埋めて保存した時点で初めて
 * 「画像形式が許可されていません。」と弾かれ、入力内容が無駄になる。
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** `<input type="file">` の accept 属性値。`image/*` へ戻すと上記の集合と食い違う */
export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

/**
 * 選択・ドロップされたファイルを受け付けてよいかを判定する。
 * accept 属性はドラッグ&ドロップには効かないため、取り込み側でも必ず通すこと。
 */
export function isAllowedImageFile(file: File): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
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

export async function compressAndGetBase64(file: File): Promise<string> {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(compressedFile);
  });
}
