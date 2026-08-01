import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readStorage, writeStorage } from "./storage";

describe("readStorage / writeStorage", () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };

  beforeEach(() => {
    for (const key in store) delete store[key];
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("保存した値を読み戻せること", () => {
    expect(writeStorage("key", "value")).toBe(true);
    expect(readStorage("key")).toBe("value");
  });

  it("保存が無い場合は null を返すこと", () => {
    expect(readStorage("missing")).toBeNull();
  });

  it("読み取りが例外になっても落ちず、警告を出して null を返すこと", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readStorage("key")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      'Failed to read "key" from localStorage:',
      expect.any(Error),
    );
  });

  it("読み取り例外時の戻り値を指定できること（テーマ判定がこれに依存している）", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // 保存が無い場合 (null) と読めない場合を呼び出し側が区別できること
    expect(readStorage("key", "dark")).toBe("dark");
  });

  it("書き込みが例外になったら false を返し、エラーとして記録すること", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });

    expect(writeStorage("key", "value")).toBe(false);
    expect(error).toHaveBeenCalledWith(
      'Failed to save "key" to localStorage:',
      expect.any(Error),
    );
  });

  it("localStorage が存在しない環境でも例外にならないこと", () => {
    vi.stubGlobal("window", undefined);

    expect(readStorage("key")).toBeNull();
    expect(writeStorage("key", "value")).toBe(false);
  });
});
