import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getInitialTheme, getInitialIsMobile, saveTheme, applyThemeClass } from "./theme";
import { THEME_STORAGE_KEY, MOBILE_BREAKPOINT } from "./constants";

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

describe("getInitialIsMobile", () => {
  it("should return false when window is undefined", () => {
    const origWindow = globalThis.window;
    // @ts-expect-error - allow modifying global window object for testing SSR
    delete globalThis.window;

    expect(getInitialIsMobile()).toBe(false);

    globalThis.window = origWindow;
  });

  it("should return false when window.innerWidth is greater than or equal to MOBILE_BREAKPOINT", () => {
    vi.stubGlobal("innerWidth", MOBILE_BREAKPOINT);
    expect(getInitialIsMobile()).toBe(false);

    vi.stubGlobal("innerWidth", MOBILE_BREAKPOINT + 100);
    expect(getInitialIsMobile()).toBe(false);

    vi.unstubAllGlobals();
  });

  it("should return true when window.innerWidth is less than MOBILE_BREAKPOINT", () => {
    vi.stubGlobal("innerWidth", MOBILE_BREAKPOINT - 1);
    expect(getInitialIsMobile()).toBe(true);

    vi.stubGlobal("innerWidth", 320);
    expect(getInitialIsMobile()).toBe(true);

    vi.unstubAllGlobals();
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

  it("should save specified theme to localStorage", () => {
    saveTheme("light");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "light");

    saveTheme("dark");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "dark");
  });
});

describe("applyThemeClass", () => {
  afterEach(() => {
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
