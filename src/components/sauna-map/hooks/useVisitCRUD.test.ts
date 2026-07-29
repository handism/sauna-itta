import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  createNewVisit,
  getUpdatedVisits,
  getVisitsWithRemovedHistory,
  useVisitCRUD,
} from "./useVisitCRUD";
import { SaunaVisit, VisitFormState } from "../types";

describe("useVisitCRUD - Pure Functions", () => {
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

describe("useVisitCRUD - Hook Integration", () => {
  const sampleForm: VisitFormState = {
    name: "北欧",
    status: "visited",
    area: "東京都",
    date: "2026-01-01",
    comment: "最高でした",
    rating: 5,
    image: "",
    tagsText: "サウナ",
    appendHistory: false,
  };

  it("addVisit で新しい訪問が追加され saveVisits が呼ばれる", () => {
    const saveVisits = vi.fn().mockReturnValue(true);
    const initialVisits: SaunaVisit[] = [];

    const { result } = renderHook(() => useVisitCRUD(initialVisits, saveVisits));

    act(() => {
      const res = result.current.addVisit({ lat: 35.7, lng: 139.7 }, sampleForm);
      expect(res.success).toBe(true);
    });

    expect(saveVisits).toHaveBeenCalledTimes(1);
    expect(saveVisits.mock.calls[0][0]).toHaveLength(1);
  });

  it("deleteVisit で対象の訪問が削除される", () => {
    const saveVisits = vi.fn().mockReturnValue(true);
    const initialVisits: SaunaVisit[] = [
      { id: "v1", name: "テスト", lat: 0, lng: 0, comment: "", date: "", visitCount: 1, history: [] },
    ];

    const { result } = renderHook(() => useVisitCRUD(initialVisits, saveVisits));

    act(() => {
      const res = result.current.deleteVisit("v1");
      expect(res.success).toBe(true);
    });

    expect(saveVisits).toHaveBeenCalledWith([]);
  });
});

