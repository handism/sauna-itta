import { afterEach, describe, expect, it, vi } from "vitest";
import { getDateDaysAgo, getTodayDate, parseLocalDate, toDateString } from "./date";

describe("date utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("getTodayDate", () => {
    it("YYYY-MM-DD 形式の文字列を返す", () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("UTC では前日でもローカル日付を返す", () => {
      vi.useFakeTimers();
      // UTC では 2026-07-29 だが、日本時間では 2026-07-30 の 0 時半
      vi.setSystemTime(new Date("2026-07-30T00:30:00+09:00"));

      expect(getTodayDate()).toBe("2026-07-30");
    });
  });

  describe("getDateDaysAgo", () => {
    it("0 を渡すと今日を返す", () => {
      expect(getDateDaysAgo(0)).toBe(getTodayDate());
    });

    it("指定した日数だけ遡った日付を返す", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-02T09:00:00+09:00"));

      expect(getDateDaysAgo(1)).toBe("2026-08-01");
      expect(getDateDaysAgo(7)).toBe("2026-07-26");
    });

    it("月や年をまたいでも繰り下がる", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T09:00:00+09:00"));

      expect(getDateDaysAgo(1)).toBe("2025-12-31");
    });

    it("UTC では前日の時間帯でもローカル日付を基準に遡る", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-02T00:30:00+09:00"));

      expect(getDateDaysAgo(1)).toBe("2026-08-01");
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
