import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadSavedVisits } from "./savedVisits";

describe("loadSavedVisits", () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { for (const key in store) delete store[key]; }),
  };

  beforeEach(() => {
    // restoreAllMocks は vi.fn の実装まで戻すため、先に呼んでから読み書きを張り直す
    vi.restoreAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => store[key] ?? null);
    vi.stubGlobal("localStorage", mockLocalStorage);
    for (const key in store) delete store[key];
  });

  it("should catch localStorage errors when reading visits, log warning and return baseVisits", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(mockLocalStorage, "getItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const visits = loadSavedVisits().visits;
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.length).toBeGreaterThan(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to read "sauna-itta_visits" from localStorage:',
      expect.any(Error),
    );
  });

  it("should catch JSON.parse errors, log error and return baseVisits", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    store["sauna-itta_visits"] = "{ invalid_json }";

    const visits = loadSavedVisits().visits;
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.length).toBeGreaterThan(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to parse saved visits:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("JSONとして壊れた保存値は生の文字列のまま unreadable に残すこと", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    store["sauna-itta_visits"] = "{ invalid_json }";

    expect(loadSavedVisits().unreadable).toEqual(["{ invalid_json }"]);
  });

  it("should return baseVisits if parsed saved data is not an array", () => {
    store["sauna-itta_visits"] = JSON.stringify({ not: "an array" });

    const visits = loadSavedVisits().visits;
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.length).toBeGreaterThan(0);
  });

  it("配列でない保存値は unreadable に残すこと", () => {
    store["sauna-itta_visits"] = JSON.stringify({ not: "an array" });

    expect(loadSavedVisits().unreadable).toEqual([{ not: "an array" }]);
  });

  it("保存がまだ無い場合は同梱JSONを返すこと", () => {
    const visits = loadSavedVisits().visits;

    expect(visits.length).toBeGreaterThan(0);
  });

  it("保存がある場合は同梱JSONを足し戻さないこと（デモ記録の編集・削除が戻らない）", () => {
    const bundled = loadSavedVisits().visits;
    const edited = { ...bundled[0], name: "編集後の名前" };
    // 1件だけ編集して、残りは削除した状態を保存しておく
    store["sauna-itta_visits"] = JSON.stringify([edited]);

    const visits = loadSavedVisits().visits;

    expect(visits).toHaveLength(1);
    expect(visits[0].name).toBe("編集後の名前");
  });

  it("検証に通らない要素は unreadable として生の値のまま返すこと", () => {
    const valid = { id: "ok-1", name: "OK", lat: 35, lng: 139, date: "2026-01-01", comment: "" };
    const broken = { id: "broken-1", lat: "35" };
    store["sauna-itta_visits"] = JSON.stringify([valid, broken]);

    const { visits, unreadable } = loadSavedVisits();

    expect(visits.map((visit) => visit.id)).toEqual(["ok-1"]);
    expect(unreadable).toEqual([broken]);
  });

  it("すべて削除した状態を保存していれば空のまま復元すること", () => {
    store["sauna-itta_visits"] = JSON.stringify([]);

    expect(loadSavedVisits().visits).toEqual([]);
  });
});
