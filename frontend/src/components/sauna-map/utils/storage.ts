/**
 * localStorage への安全なアクセス。
 *
 * Safari のプライベートモードや容量超過では getItem / setItem が例外を投げる。
 * SSR（静的プリレンダリング）時には localStorage そのものが存在しない。
 * 直接触ると読み取り側の 1 箇所を try/catch 漏れさせただけで画面が落ちるため、
 * 保存値の読み書きは必ずここを経由すること。
 */

/**
 * @param onErrorValue 読み取りが例外になったときの戻り値。保存が無い場合 (null) と
 *   読めない場合を呼び出し側が区別する必要があるときに指定する
 *   （テーマ判定は読めないときだけ layout.tsx のスクリプトと同じ既定値へ倒す必要がある）。
 */
export function readStorage(key: string, onErrorValue: string | null = null): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read "${key}" from localStorage:`, error);
    return onErrorValue;
  }
}

/** 保存できたかを返す（容量超過を呼び出し側で通知に使うため） */
export function writeStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // 書き込み失敗は記録が残らないことを意味するため、読み取り失敗より重く扱う
    console.error(`Failed to save "${key}" to localStorage:`, error);
    return false;
  }
}
