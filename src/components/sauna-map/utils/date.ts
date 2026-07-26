/**
 * 今日の日付 (YYYY-MM-DD)。
 *
 * form.ts は visitHistory.ts に依存しているため、両方から使うこの関数は
 * どちらにも置けない（循環参照になる）。専用モジュールに切り出してある。
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
