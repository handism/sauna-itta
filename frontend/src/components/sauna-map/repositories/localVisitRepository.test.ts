import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalVisitRepository } from "./localVisitRepository";
import { VISITS_STORAGE_KEY } from "../utils";
import type { SaunaVisit, VisitFormState } from "../types";

const form: VisitFormState = {
  name: "北欧",
  area: "東京都",
  status: "visited",
  date: "2026-08-02",
  rating: 5,
  comment: "最高",
  image: "",
  tagsText: "外気浴, 水風呂",
  appendHistory: false,
};

// utils/storage.ts 経由の読み書きだけを再現する（jsdom の localStorage には依存しない）
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
};

function storedVisits(): SaunaVisit[] {
  return JSON.parse(store[VISITS_STORAGE_KEY] ?? "[]");
}

function seed(visits: SaunaVisit[]): void {
  store[VISITS_STORAGE_KEY] = JSON.stringify(visits);
}

const existing: SaunaVisit = {
  id: "existing-1",
  name: "サウナしきじ",
  lat: 34.9,
  lng: 138.3,
  date: "2026-07-01",
  comment: "水風呂が良い",
  status: "visited",
  history: [
    { date: "2026-06-01", comment: "1回目", rating: 4, image: "" },
    { date: "2026-07-01", comment: "2回目", rating: 5, image: "" },
  ],
};

describe("LocalVisitRepository", () => {
  let repository: LocalVisitRepository;

  beforeEach(() => {
    for (const key in store) delete store[key];
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    repository = new LocalVisitRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("localモードは常に認証済みとして扱う", async () => {
    await expect(repository.getSession()).resolves.toEqual({
      authenticated: true,
      user: null,
      csrfToken: null,
    });
    expect(repository.dataSource).toBe("local");
  });

  it("新規作成した記録を先頭へ保存する", async () => {
    seed([existing]);

    const created = await repository.create({ lat: 35.71, lng: 139.77 }, form);

    expect(created).toMatchObject({ name: "北欧", lat: 35.71, lng: 139.77, status: "visited" });
    expect(created.tags).toEqual(["外気浴", "水風呂"]);
    expect(storedVisits().map((visit) => visit.id)).toEqual([created.id, "existing-1"]);
  });

  it("更新は対象の記録だけを書き換えて返す", async () => {
    seed([existing]);

    const updated = await repository.update("existing-1", { lat: 34.9, lng: 138.3 }, {
      ...form,
      name: "サウナしきじ（改）",
      appendHistory: true,
    });

    expect(updated.name).toBe("サウナしきじ（改）");
    expect(updated.history).toHaveLength(3);
    expect(storedVisits()[0].name).toBe("サウナしきじ（改）");
  });

  it("存在しないIDの更新は保存せずにエラーにする", async () => {
    seed([existing]);

    await expect(repository.update("missing", { lat: 35, lng: 139 }, form)).rejects.toThrow(
      "更新対象が見つかりません。",
    );
    expect(storedVisits()).toHaveLength(1);
  });

  it("削除した記録を保存内容から取り除く", async () => {
    seed([existing]);

    await repository.delete("existing-1");

    expect(storedVisits()).toEqual([]);
  });

  it("履歴の削除は残った最新の履歴を代表値へ反映する", async () => {
    seed([existing]);

    const updated = await repository.deleteHistoryEntry(existing, 1);

    expect(updated.history).toHaveLength(1);
    expect(updated.date).toBe("2026-06-01");
    expect(updated.comment).toBe("1回目");
    expect(storedVisits()[0].history).toHaveLength(1);
  });

  it("インポートは既存IDをスキップして追加件数を返す", async () => {
    seed([existing]);
    const imported: SaunaVisit[] = [
      { ...existing, comment: "重複" },
      { id: "new-1", name: "スカイスパ", lat: 35.4, lng: 139.6, date: "2026-08-01", comment: "" },
    ];

    await expect(repository.importBatch(imported)).resolves.toEqual({ added: 1, skipped: 1 });
    expect(storedVisits().map((visit) => visit.id)).toEqual(["new-1", "existing-1"]);
  });

  it("追加分が無いインポートは保存を行わない", async () => {
    seed([existing]);

    await expect(repository.importBatch([existing])).resolves.toEqual({ added: 0, skipped: 1 });
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it("保存に失敗した場合は理由の分かるエラーを投げる", async () => {
    seed([existing]);
    // 容量超過時に localStorage が例外を投げる状況を再現する
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    await expect(repository.create({ lat: 35, lng: 139 }, form)).rejects.toThrow(
      "ブラウザへの保存に失敗しました。",
    );
    await expect(repository.delete("existing-1")).rejects.toThrow("ブラウザへの保存に失敗しました。");
    expect(error).toHaveBeenCalled();
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
  });

  it("保存が空のときは同梱JSONの記録を返す", async () => {
    const visits = await repository.list();

    expect(visits.length).toBeGreaterThan(0);
    expect(visits.every((visit) => typeof visit.id === "string")).toBe(true);
  });

  it("保存済みの記録を読み出す", async () => {
    seed([existing]);

    const visits = await repository.list();

    expect(visits.map((visit) => visit.id)).toContain("existing-1");
  });
});
