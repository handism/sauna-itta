import { THEME_STORAGE_KEY, MOBILE_BREAKPOINT } from "./constants";
import { readStorage, writeStorage } from "./storage";

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

  /*
   * 読めなかった場合は "dark" に倒す。layout.tsx のちらつき防止スクリプトは
   * 例外時に light-theme を付けないため、ここで OS 設定を見に行くと
   * 初期描画とズレて画面がちらつく。
   */
  const savedTheme = readStorage(THEME_STORAGE_KEY, "dark");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  // 明示的な選択がない場合は OS 設定に従う
  return getPreferredColorScheme();
}

export function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

/** テーマの選択を保存する。localStorage が使えない環境では黙って諦める */
export function saveTheme(theme: "dark" | "light"): void {
  writeStorage(THEME_STORAGE_KEY, theme);
}

export function applyThemeClass(theme: "dark" | "light"): void {
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  } else {
    document.documentElement.classList.remove("light-theme");
  }
}
