import { describe, it, expect, beforeEach, vi } from "vitest";
import imageCompression from "browser-image-compression";
import { compressAndGetBase64, sanitizeImageUrl } from "./image";

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
});
