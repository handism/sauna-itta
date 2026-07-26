import imageCompression from "browser-image-compression";

/** 許可する data URL の MIME タイプ。SVG はスクリプトを埋め込めるため意図的に除く */
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
