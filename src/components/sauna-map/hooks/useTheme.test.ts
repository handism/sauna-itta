import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";
import { THEME_STORAGE_KEY } from "../utils";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("light-theme");
  });

  it("should initialize with dark theme by default", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("should toggle theme to light and save to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  describe("deferred モード", () => {
    it("syncFromStorage を呼ぶまで保存値を読まないこと", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "light");

      const { result } = renderHook(() => useTheme({ deferred: true }));

      // 静的プリレンダリング時と同じ既定値のまま
      expect(result.current.theme).toBe("dark");

      act(() => {
        result.current.syncFromStorage();
      });

      expect(result.current.theme).toBe("light");
    });

    it("syncFromStorage を呼ぶまで html のクラスを触らないこと", () => {
      // layout.tsx のインラインスクリプトが付けたクラスを剥がしてはいけない
      document.documentElement.classList.add("light-theme");
      window.localStorage.setItem(THEME_STORAGE_KEY, "light");

      const { result } = renderHook(() => useTheme({ deferred: true }));

      expect(document.documentElement.classList.contains("light-theme")).toBe(true);

      act(() => {
        result.current.syncFromStorage();
      });

      expect(document.documentElement.classList.contains("light-theme")).toBe(true);
    });

    it("syncFromStorage を経ずに toggleTheme しても反映されること", () => {
      const { result } = renderHook(() => useTheme({ deferred: true }));

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("light-theme")).toBe(true);
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
  });
});
