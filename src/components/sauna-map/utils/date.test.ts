import { afterEach, describe, expect, it, vi } from "vitest";
import { getTodayDate, parseLocalDate, toDateString } from "./date";

describe("date utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTodayDate", () => {
    it("YYYY-MM-DD 形式の文字列を返す", () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("UTC では前日でもローカル日付を返す", () => {
      vi.spyOn(Date.prototype, "getFullYear").mockReturnValue(2026);
      vi.spyOn(Date.prototype, "getMonth").mockReturnValue(6);
      vi.spyOn(Date.prototype, "getDate").mockReturnValue(30);
      vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
        "2026-07-29T15:30:00.000Z",
      );

      expect(getTodayDate()).toBe("2026-07-30");
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
