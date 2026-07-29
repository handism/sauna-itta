import { describe, expect, it } from "vitest";
import { getTodayDate, parseLocalDate, toDateString } from "./date";

describe("date utils", () => {
  describe("getTodayDate", () => {
    it("YYYY-MM-DD 形式の文字列を返す", () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("parseLocalDate", () => {
    it("YYYY-MM-DD 形式の文字列を正確なローカル日付オブジェクトにパースする", () => {
      const parsed = parseLocalDate("2026-07-29");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(6); // 0-indexed, 7月は6
      expect(parsed.getDate()).toBe(29);
    });

    it("Date オブジェクトが渡された場合はそのまま返す", () => {
      const d = new Date(2026, 6, 29);
      expect(parseLocalDate(d)).toBe(d);
    });

    it("YYYY/MM/DD やその他の形式はフォールバックしてパースする", () => {
      const parsed = parseLocalDate("2026/07/29");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(6);
      expect(parsed.getDate()).toBe(29);
    });
  });

  describe("toDateString", () => {
    it("YYYY-MM-DD 形式の日付を toDateString() 形式に変換する", () => {
      const dateStr = toDateString("2026-07-29");
      const expected = new Date(2026, 6, 29).toDateString();
      expect(dateStr).toBe(expected);
    });
  });
});
