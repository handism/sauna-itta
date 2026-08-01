import { useState, useEffect, useCallback } from "react";
import { getInitialTheme, applyThemeClass, saveTheme } from "../utils";

export interface UseThemeOptions {
  /**
   * true にすると、保存値の読み取り（`getInitialTheme()`）と `html` へのクラス適用を
   * `syncFromStorage()` が呼ばれるまで行わない。
   *
   * 統計ページのように静的プリレンダリングされる画面向け。マウント直後に既定値の
   * "dark" でクラスを適用すると、`layout.tsx` のインラインスクリプトが先に付けた
   * `light-theme` を剥がしてしまい、ライトテーマ利用者に一瞬ダークが見えてしまう。
   * 呼び出し側は他のクライアント専用初期化と同じタイミングで `syncFromStorage()` を
   * 呼ぶこと（同一レンダーにまとまり、ちらつきも余分な再描画も起きない）。
   */
  deferred?: boolean;
}

export function useTheme({ deferred = false }: UseThemeOptions = {}) {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    deferred ? "dark" : getInitialTheme(),
  );
  const [isSynced, setIsSynced] = useState(!deferred);

  useEffect(() => {
    if (!isSynced) return;
    applyThemeClass(theme);
  }, [theme, isSynced]);

  /** 保存値を読み込んでテーマを確定させる。deferred で開始した場合のみ必要。 */
  const syncFromStorage = useCallback(() => {
    setTheme(getInitialTheme());
    setIsSynced(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";
      saveTheme(newTheme);
      return newTheme;
    });
    setIsSynced(true);
  }, []);

  return { theme, toggleTheme, syncFromStorage };
}
