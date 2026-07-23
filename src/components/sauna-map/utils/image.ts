import imageCompression from "browser-image-compression";

export function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    if (parsed.protocol === "data:" && /^image\/(jpeg|jpg|png|gif|webp|bmp)(;|,)/i.test(parsed.pathname)) {
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
