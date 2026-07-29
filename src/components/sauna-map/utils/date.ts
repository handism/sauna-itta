/**
 * 今日の日付 (YYYY-MM-DD)。
 *
 * form.ts は visitHistory.ts に依存しているため、両方から使うこの関数は
 * どちらにも置けない（循環参照になる）。専用モジュールに切り出してある。
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 形式の日付文字列（またはそれ以外の日付表現/Date）をローカルタイムゾーンの Date オブジェクトにパースする。
 * 'YYYY-MM-DD' 形式の場合は `new Date(y, m, d)` を使うことで、ブラウザ間の解釈差異やパースコストを回避する。
 */
export function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (
    typeof dateInput === "string" &&
    dateInput.length === 10 &&
    dateInput[4] === "-" &&
    dateInput[7] === "-"
  ) {
    const y = parseInt(dateInput.substring(0, 4), 10);
    const m = parseInt(dateInput.substring(5, 7), 10) - 1;
    const d = parseInt(dateInput.substring(8, 10), 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const dateToParse =
    typeof dateInput === "string" ? dateInput.replace(/-/g, "/") : dateInput;
  return new Date(dateToParse);
}

/**
 * 日付文字列（または Date）を `Date.prototype.toDateString()` 形式に変換する。
 */
export function toDateString(dateInput: string | Date): string {
  return parseLocalDate(dateInput).toDateString();
}
