/** Date をローカルタイムゾーンのまま YYYY-MM-DD にする（UTC へ倒さない）。 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 今日から `daysAgo` 日前の日付 (YYYY-MM-DD)。
 *
 * 「今日」「昨日」のようなクイック入力もここを通すこと。呼び出し側で
 * `new Date()` を組み立て直すと、UTC 変換の有無が箇所ごとにずれます。
 */
export function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatLocalDate(date);
}

/**
 * 今日の日付 (YYYY-MM-DD)。
 *
 * form.ts は visitHistory.ts に依存しているため、両方から使うこの関数は
 * どちらにも置けない（循環参照になる）。専用モジュールに切り出してある。
 */
export function getTodayDate(): string {
  return getDateDaysAgo(0);
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
