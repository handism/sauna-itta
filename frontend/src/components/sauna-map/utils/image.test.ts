import { describe, it, expect, beforeEach, vi } from "vitest";
import imageCompression from "browser-image-compression";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_INPUT_ACCEPT,
  compressAndGetBase64,
  convertDataUrlImage,
  describeDataUrlImage,
  isAllowedImageFile,
  needsImageConversion,
  sanitizeImageUrl,
} from "./image";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));

describe("compressAndGetBase64", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compress file and return base64 string on success", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const readAsDataURLMock = vi.fn();
    class MockFileReader {
      result = "data:image/png;base64,compressed";
      onloadend: (() => void) | null = null;
      readAsDataURL(file: File) {
        readAsDataURLMock(file);
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    const result = await compressAndGetBase64(mockFile);

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
    });
    expect(readAsDataURLMock).toHaveBeenCalledWith(mockCompressedFile);
    expect(result).toBe("data:image/png;base64,compressed");

    global.FileReader = originalFileReader;
  });

  it("should reject when FileReader encounters an error", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const mockError = new Error("Specific file read error");

    class MockFileReader {
      error = mockError;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow("Specific file read error");

    global.FileReader = originalFileReader;
  });

  it("should reject with default error when FileReader error is null", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    class MockFileReader {
      error = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow("Failed to read file");

    global.FileReader = originalFileReader;
  });
});

/** readAsDataURL で決まった data URL を返す FileReader に差し替え、元へ戻す関数を返す */
function stubFileReader(result: string) {
  class MockFileReader {
    result = result;
    onloadend: (() => void) | null = null;
    readAsDataURL() {
      setTimeout(() => this.onloadend?.(), 0);
    }
  }
  const original = global.FileReader;
  global.FileReader = MockFileReader as unknown as typeof FileReader;
  return () => {
    global.FileReader = original;
  };
}

describe("describeDataUrlImage", () => {
  it("Base64 の data URL の MIME と復号後のバイト数を返す", () => {
    expect(describeDataUrlImage("data:image/PNG;base64,AAAA")).toEqual({ mimeType: "image/png", bytes: 3 });
    expect(describeDataUrlImage("data:image/png;base64,AAA=")).toEqual({ mimeType: "image/png", bytes: 2 });
    expect(describeDataUrlImage("data:image/png;base64,AA==")).toEqual({ mimeType: "image/png", bytes: 1 });
  });

  it("Base64 の data URL でなければ null を返す", () => {
    expect(describeDataUrlImage(undefined)).toBeNull();
    expect(describeDataUrlImage("/api/v1/images/abc")).toBeNull();
    expect(describeDataUrlImage("data:image/png,raw")).toBeNull();
  });
});

/** 各形式の先頭のバイト列を持つ、サーバーの DataUrlImage が受け付ける data URL */
const VALID_DATA_URLS: Record<string, string> = {
  "image/jpeg": `data:image/jpeg;base64,${btoa("\xff\xd8\xff\xe0\x00\x10JFIF")}`,
  "image/png": `data:image/png;base64,${btoa("\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR")}`,
  "image/gif": `data:image/gif;base64,${btoa("GIF89a\x01\x00\x01\x00")}`,
  "image/webp": `data:image/webp;base64,${btoa("RIFF\x24\x00\x00\x00WEBPVP8 ")}`,
};

describe("needsImageConversion", () => {
  it("サーバーが受け付けない形式の data URL は変換の対象にする", () => {
    expect(needsImageConversion("data:image/bmp;base64,Qk0=")).toBe(true);
    expect(needsImageConversion("data:image/jpg;base64,/9j/")).toBe(true);
    expect(needsImageConversion("data:image/png,raw")).toBe(true);
  });

  it("サーバーの DataUrlImage と同じく、大文字の表記や Base64 以外の文字を含む値は変換の対象にする", () => {
    const png = VALID_DATA_URLS["image/png"];
    const encoded = png.slice(png.indexOf(",") + 1);
    expect(needsImageConversion(`data:IMAGE/PNG;base64,${encoded}`)).toBe(true);
    expect(needsImageConversion(`DATA:image/png;base64,${encoded}`)).toBe(true);
    expect(needsImageConversion(`data:image/png;base64,${encoded.slice(0, 4)} ${encoded.slice(4)}`)).toBe(true);
    expect(needsImageConversion(`data:image/png;charset=utf-8;base64,${encoded}`)).toBe(true);
    // 改行はサーバーも取り除いて受け付ける
    expect(needsImageConversion(`data:image/png;base64,${encoded.slice(0, 8)}\r\n${encoded.slice(8)}`)).toBe(false);
  });

  it("サーバーの strict_decode64 が拒否する Base64 は変換の対象にする", () => {
    const jpeg = VALID_DATA_URLS["image/jpeg"];
    // 長さが 4 の倍数でない
    expect(needsImageConversion(`${jpeg}A`)).toBe(true);
    // 途中に = がある
    expect(needsImageConversion(`data:image/jpeg;base64,/9j/4A==AAAA`)).toBe(true);
    // パディングの前で使われないビットが 0 でない（"/9j/4B==" は 0xE0 に 1 ビット余る）
    expect(needsImageConversion("data:image/jpeg;base64,/9j/4B==")).toBe(true);
    expect(needsImageConversion("data:image/jpeg;base64,/9j/4A==")).toBe(false);
  });

  it("宣言した形式と中身の先頭のバイト列が違う写真は変換の対象にする", () => {
    const jpegBody = VALID_DATA_URLS["image/jpeg"].split(",")[1];
    expect(needsImageConversion(`data:image/png;base64,${jpegBody}`)).toBe(true);
    // 中身が先頭のバイト列より短い
    expect(needsImageConversion("data:image/png;base64,iVBO")).toBe(true);
    expect(needsImageConversion("data:image/jpeg;base64,AAAA")).toBe(true);
  });

  it("上限を超える大きさの写真は許可した形式でも変換の対象にする", () => {
    const oversized = `${VALID_DATA_URLS["image/jpeg"]}${"A".repeat(Math.ceil((1024 * 1024 * 4) / 3) + 4)}`;
    expect(needsImageConversion(oversized)).toBe(true);
  });

  it("許可した形式で中身が一致する上限内の写真と、data URL でない値は対象にしない", () => {
    for (const type of ALLOWED_IMAGE_MIME_TYPES) {
      // 許可形式を apiLimits.json へ足したら、上の VALID_DATA_URLS と image.ts の IMAGE_SIGNATURES にも足す
      expect(VALID_DATA_URLS[type], type).toBeDefined();
      expect(needsImageConversion(VALID_DATA_URLS[type]), type).toBe(false);
    }
    expect(needsImageConversion(undefined)).toBe(false);
    expect(needsImageConversion("")).toBe(false);
    expect(needsImageConversion("/api/v1/images/abc")).toBe(false);
  });
});

describe("convertDataUrlImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("復号した写真を JPEG へ圧縮し直した data URL を返す", async () => {
    vi.mocked(imageCompression).mockResolvedValue(new File(["jpeg"], "imported-image", { type: "image/jpeg" }));
    const restore = stubFileReader("data:image/jpeg;base64,/9j/");

    await expect(convertDataUrlImage("data:image/bmp;base64,Qk0=")).resolves.toBe("data:image/jpeg;base64,/9j/");

    const [file, options] = vi.mocked(imageCompression).mock.calls[0];
    expect(file.type).toBe("image/bmp");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([0x42, 0x4d]));
    expect(options).toEqual({ maxSizeMB: 1, maxWidthOrHeight: 1024, fileType: "image/jpeg" });
    restore();
  });

  it("大文字の MIME は小文字にそろえてから圧縮する", async () => {
    vi.mocked(imageCompression).mockResolvedValue(new File(["jpeg"], "imported-image", { type: "image/jpeg" }));
    const restore = stubFileReader("data:image/jpeg;base64,/9j/");

    await expect(convertDataUrlImage("data:IMAGE/PNG;base64,iVBO")).resolves.toBe("data:image/jpeg;base64,/9j/");
    expect(vi.mocked(imageCompression).mock.calls[0][0].type).toBe("image/png");
    restore();
  });

  it("変換後もサーバーが受け付けない写真なら reject する", async () => {
    vi.mocked(imageCompression).mockResolvedValue(new File(["bmp"], "imported-image", { type: "image/bmp" }));
    const restore = stubFileReader("data:image/bmp;base64,Qk0=");

    await expect(convertDataUrlImage("data:image/bmp;base64,Qk0=")).rejects.toThrow();
    restore();
  });

  it("Base64 でない data URL は圧縮せずに reject する", async () => {
    await expect(convertDataUrlImage("data:image/bmp,raw")).rejects.toThrow();
    expect(imageCompression).not.toHaveBeenCalled();
  });
});

describe("sanitizeImageUrl", () => {
  it("should return the url for valid http and https urls", () => {
    expect(sanitizeImageUrl("http://example.com/image.jpg")).toBe("http://example.com/image.jpg");
    expect(sanitizeImageUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg");
  });

  it("should return the url for relative and absolute paths", () => {
    expect(sanitizeImageUrl("/images/photo.jpg")).toBe("/images/photo.jpg");
    expect(sanitizeImageUrl("images/photo.jpg")).toBe("images/photo.jpg");
  });

  it("should return the url for valid data:image/* urls", () => {
    expect(sanitizeImageUrl("data:image/png;base64,iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(sanitizeImageUrl("data:image/jpeg;base64,/9j/4AAQSkZJRgABA=")).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRgABA=");
  });

  it("should return undefined for falsy inputs", () => {
    expect(sanitizeImageUrl(undefined)).toBeUndefined();
    expect(sanitizeImageUrl("")).toBeUndefined();
  });

  it("should return undefined for invalid data: urls", () => {
    expect(sanitizeImageUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBeUndefined();
    expect(sanitizeImageUrl("data:text/plain,hello")).toBeUndefined();
  });

  it("should return undefined for dangerous protocols", () => {
    expect(sanitizeImageUrl("ftp://example.com/image.jpg")).toBeUndefined();
    expect(sanitizeImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeImageUrl("file:///etc/passwd")).toBeUndefined();
    expect(sanitizeImageUrl("vbscript:msgbox(\"test\")")).toBeUndefined();
  });

  it("should return undefined for invalid or unparseable URLs", () => {
    expect(sanitizeImageUrl("http://[::1")).toBeUndefined();
    expect(sanitizeImageUrl("http://[1:2:3:4:5:6:7:8:9]/")).toBeUndefined();
    expect(sanitizeImageUrl("https://example.com:99999")).toBeUndefined();
  });

  it("should allow safe http/https URLs", () => {
    expect(sanitizeImageUrl("http://example.com/image.png")).toBe("http://example.com/image.png");
    expect(sanitizeImageUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg");
  });

  it("should allow safe data URIs", () => {
    const safePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    expect(sanitizeImageUrl(safePng)).toBe(safePng);

    const safeJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";
    expect(sanitizeImageUrl(safeJpeg)).toBe(safeJpeg);
  });

  it("should block dangerous data URIs", () => {
    const dangerousSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=";
    expect(sanitizeImageUrl(dangerousSvg)).toBeUndefined();

    const dangerousHtml = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==";
    expect(sanitizeImageUrl(dangerousHtml)).toBeUndefined();
  });

  it("should block invalid URLs", () => {
    expect(sanitizeImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeImageUrl("ftp://example.com/image.png")).toBeUndefined();
  });

  it("should treat the data: scheme case-insensitively", () => {
    expect(sanitizeImageUrl("DATA:IMAGE/PNG;base64,iVBORw0KGgo=")).toBe(
      "DATA:IMAGE/PNG;base64,iVBORw0KGgo=",
    );
    // スキームだけ大文字でも MIME の判定は緩めないこと
    expect(sanitizeImageUrl("Data:text/html,<script>")).toBeUndefined();
  });

  it("should not run the URL parser over data URLs", () => {
    /*
     * 1MB 級の Base64 を new URL() に通すと、一覧の 1 行を描画するたびに
     * 文字列全体の走査費用を払うことになる。URL を使ったら失敗するようにして検知する。
     */
    const big = `data:image/jpeg;base64,${"A".repeat(200_000)}`;
    vi.stubGlobal(
      "URL",
      class {
        constructor() {
          throw new Error("data URL の判定に URL パーサを使わないこと");
        }
      },
    );

    expect(sanitizeImageUrl(big)).toBe(big);
    expect(sanitizeImageUrl("data:text/html,<script>")).toBeUndefined();

    vi.unstubAllGlobals();
  });
});

describe("isAllowedImageFile", () => {
  it.each(ALLOWED_IMAGE_MIME_TYPES)("%s を受け付けること", (type) => {
    expect(isAllowedImageFile(new File([""], "sauna", { type }))).toBe(true);
  });

  it.each(["image/bmp", "image/heic", "image/svg+xml", "application/pdf", ""])(
    "バックエンドが弾く %s を取り込み前に拒否すること",
    (type) => {
      expect(isAllowedImageFile(new File([""], "sauna", { type }))).toBe(false);
    },
  );
});

describe("IMAGE_INPUT_ACCEPT", () => {
  it("accept 属性として許可 MIME だけを列挙すること（image/* へ戻すと保存時まで気づけない）", () => {
    expect(IMAGE_INPUT_ACCEPT).toBe("image/jpeg,image/png,image/webp,image/gif");
  });
});
