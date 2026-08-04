import { describe, it, expect } from "vitest";
import {
  createNewVisit,
  getUpdatedVisits,
  getVisitsWithRemovedHistory,
} from "./visitMutation";
import { SaunaVisit, VisitFormState } from "../types";

describe("visitMutation - Pure Functions", () => {
  const sampleForm: VisitFormState = {
    name: "北欧",
    status: "visited",
    area: "東京都",
    date: "2026-01-01",
    comment: "最高でした",
    rating: 5,
    image: "",
    tagsText: "サウナ, 水風呂",
    appendHistory: false,
  };

  describe("createNewVisit", () => {
    it("新しい訪問記録を正しい初期構造で生成する", () => {
      const selected = { lat: 35.71, lng: 139.77 };
      const result = createNewVisit(selected, sampleForm);

      expect(result.name).toBe("北欧");
      expect(result.lat).toBe(35.71);
      expect(result.lng).toBe(139.77);
      expect(result.status).toBe("visited");
      expect(result.area).toBe("東京都");
      expect(result.visitCount).toBe(1);
      expect(result.tags).toEqual(["サウナ", "水風呂"]);
      expect(result.history).toBeDefined();
      expect(result.history?.[0]).toEqual({
        date: "2026-01-01",
        comment: "最高でした",
        rating: 5,
        image: "",
      });
    });

    it("UUID 形式の ID を生成する", () => {
      const selected = { lat: 35.71, lng: 139.77 };
      const result = createNewVisit(selected, sampleForm);
      // RFC 4122 UUID v4 形式を検証
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("連続して呼んでも重複しない ID を生成する", () => {
      const selected = { lat: 35.71, lng: 139.77 };
      const ids = new Set(
        Array.from({ length: 100 }, () => createNewVisit(selected, sampleForm).id),
      );
      expect(ids.size).toBe(100);
    });
  });

  describe("getUpdatedVisits", () => {
    it("対象IDの訪問記録を更新する", () => {
      const existing: SaunaVisit[] = [
        {
          id: "visit-1",
          name: "旧店名",
          lat: 35.0,
          lng: 139.0,
          comment: "旧コメント",
          date: "2025-12-31",
          status: "visited",
          visitCount: 1,
          history: [{ date: "2025-12-31", comment: "旧", rating: 3 }],
        },
      ];

      const selected = { lat: 35.71, lng: 139.77 };
      const updatedList = getUpdatedVisits(existing, "visit-1", selected, sampleForm);

      expect(updatedList).toHaveLength(1);
      expect(updatedList[0].name).toBe("北欧");
      expect(updatedList[0].lat).toBe(35.71);
      expect(updatedList[0].lng).toBe(139.77);
      expect(updatedList[0].tags).toEqual(["サウナ", "水風呂"]);
    });
  });

  describe("getVisitsWithRemovedHistory", () => {
    it("履歴が2件以上ある場合、指定インデックスの履歴を削除し最新情報で更新する", () => {
      const existing: SaunaVisit[] = [
        {
          id: "v1",
          name: "サウナしきじ",
          lat: 34.9,
          lng: 138.4,
          date: "2026-02-01",
          comment: "2回目",
          rating: 5,
          visitCount: 2,
          history: [
            { date: "2026-01-01", comment: "1回目", rating: 4 },
            { date: "2026-02-01", comment: "2回目", rating: 5 },
          ],
        },
      ];

      // index 1 の履歴（最新）を削除
      const result = getVisitsWithRemovedHistory(existing, "v1", 1);
      expect(result[0].history).toHaveLength(1);
      expect(result[0].history?.[0].comment).toBe("1回目");
      expect(result[0].comment).toBe("1回目");
      expect(result[0].visitCount).toBe(1);
    });

    it("履歴が1件以下の場合は削除を行わない", () => {
      const existing: SaunaVisit[] = [
        {
          id: "v1",
          name: "サウナしきじ",
          lat: 34.9,
          lng: 138.4,
          comment: "1回目",
          date: "2026-01-01",
          visitCount: 1,
          history: [{ date: "2026-01-01", comment: "1回目", rating: 4 }],
        },
      ];

      const result = getVisitsWithRemovedHistory(existing, "v1", 0);
      expect(result[0].history).toHaveLength(1);
    });
  });
});
