import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getInitialTheme, applyThemeClass, saveTheme } from "./theme";
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

  it("should fall back to the OS color scheme when nothing is saved", () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: light)",
    }));
    vi.stubGlobal("matchMedia", matchMedia);

    expect(getInitialTheme()).toBe("light");
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: light)");

    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    expect(getInitialTheme()).toBe("dark");

    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", mockLocalStorage);
  });

  it("should prefer the saved theme over the OS color scheme", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    mockLocalStorage.setItem(THEME_STORAGE_KEY, "dark");

    expect(getInitialTheme()).toBe("dark");

    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", mockLocalStorage);
  });

  it("should catch localStorage errors and log warning, returning 'dark'", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(mockLocalStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access denied");
    });

    expect(getInitialTheme()).toBe("dark");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Failed to read "${THEME_STORAGE_KEY}" from localStorage:`,
      expect.any(Error),
    );
  });
});

describe("applyThemeClass", () => {
  beforeEach(() => {
    document.documentElement.className = "";
  });

  it("should add 'light-theme' class when theme is 'light'", () => {
    applyThemeClass("light");
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });

  it("should remove 'light-theme' class when theme is 'dark'", () => {
    document.documentElement.classList.add("light-theme");
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("light-theme")).toBe(false);
  });
});

describe("saveTheme", () => {
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should save theme to localStorage", () => {
    saveTheme("light");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "light");
    expect(store[THEME_STORAGE_KEY]).toBe("light");
  });
});
