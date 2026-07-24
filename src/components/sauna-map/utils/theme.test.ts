import { describe, it, expect, beforeEach, vi } from "vitest";
import { getInitialTheme } from "./theme";
import { THEME_STORAGE_KEY } from "./constants";

describe("getInitialTheme", () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { for (const key in store) delete store[key]; }),
  };

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  it("should return saved theme if valid ('light' or 'dark')", () => {
    mockLocalStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(getInitialTheme()).toBe("light");

    mockLocalStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(getInitialTheme()).toBe("dark");
  });

  it("should return 'dark' if saved theme is invalid or empty", () => {
    mockLocalStorage.setItem(THEME_STORAGE_KEY, "invalid_theme");
    expect(getInitialTheme()).toBe("dark");
  });

  it("should catch localStorage errors and log warning, returning 'dark'", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(mockLocalStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access denied");
    });

    expect(getInitialTheme()).toBe("dark");
    expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to read theme from localStorage:", expect.any(Error));
  });
});
