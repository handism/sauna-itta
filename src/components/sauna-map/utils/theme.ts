import { THEME_STORAGE_KEY, MOBILE_BREAKPOINT } from "./constants";

/**
 * OS のカラースキーム設定。matchMedia が使えない環境では "dark" を返す。
 * layout.tsx のちらつき防止スクリプトと同じ判定ロジックを保つこと。
 */
function getPreferredColorScheme(): "dark" | "light" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
    return "dark";
  }

  // 明示的な選択がない場合は OS 設定に従う
  return getPreferredColorScheme();
}

export function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

/** テーマの選択を保存する。localStorage が使えない環境では黙って諦める */
export function saveTheme(theme: "dark" | "light"): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error);
  }
}

export function applyThemeClass(theme: "dark" | "light"): void {
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  } else {
    document.documentElement.classList.remove("light-theme");
  }
}
