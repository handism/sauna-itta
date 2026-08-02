import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiVisitRepository } from "./apiVisitRepository";
import { RepositoryError } from "./types";
import type { SaunaVisit } from "../types";

const form = {
  name: "北欧",
  comment: "最高",
  image: "",
  date: "2026-08-02",
  rating: 5,
  tagsText: "外気浴, 水風呂",
  status: "visited" as const,
  area: "東京都",
  appendHistory: false,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function visitJson(overrides: Partial<SaunaVisit>): SaunaVisit {
  return {
    id: "sauna-1",
    name: "北欧",
    lat: 35,
    lng: 139,
    comment: "最高",
    date: "2026-08-02",
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("ApiVisitRepository", () => {
  it("セッションのCSRFトークンを変更系リクエストへ付与する", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { email: "owner@example.com" },
        csrfToken: "csrf-token",
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ saunaVisit: {
        id: "1", name: "北欧", lat: 35, lng: 139, comment: "最高", date: "2026-08-02",
      } }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const repository = new ApiVisitRepository();

    await repository.getSession();
    await repository.create({ lat: 35, lng: 139 }, form);

    const request = fetchMock.mock.calls[1][1];
    expect(new Headers(request?.headers).get("X-CSRF-Token")).toBe("csrf-token");
    expect(request?.credentials).toBe("same-origin");
  });

  it("共通エラー形式をRepositoryErrorへ変換する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      error: { code: "conflict", message: "競合しています。" },
    }), { status: 409, headers: { "Content-Type": "application/json" } }));
    const repository = new ApiVisitRepository();

    const expected = {
      code: "conflict",
      status: 409,
      message: "競合しています。",
    } satisfies Partial<RepositoryError>;
    await expect(repository.list()).rejects.toMatchObject(expected);
  });

  it("通信自体の失敗はnetwork_errorとして案内する", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const repository = new ApiVisitRepository();

    await expect(repository.list()).rejects.toMatchObject({
      code: "network_error",
      message: "サーバーへ接続できません。通信状態を確認してください。",
    });
  });

  it("エラー本文がJSONでなくても既定のメッセージを返す", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    const repository = new ApiVisitRepository();

    await expect(repository.list()).rejects.toMatchObject({
      code: "request_failed",
      status: 502,
      message: "サーバー処理に失敗しました。",
    });
  });

  it("更新時に一覧で受け取ったlockVersionを送る", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ saunaVisits: [visitJson({ lockVersion: 7 })] }))
      .mockResolvedValueOnce(jsonResponse({ saunaVisit: visitJson({ lockVersion: 8 }) }));
    const repository = new ApiVisitRepository();

    await repository.list();
    await repository.update("sauna-1", { lat: 35, lng: 139 }, form);

    const body = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(body.saunaVisit.lockVersion).toBe(7);
    expect(body.saunaVisit.tags).toEqual(["外気浴", "水風呂"]);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/sauna_visits/sauna-1");
  });

  it("削除は204を本文なしとして扱い、キャッシュからも落とす", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ saunaVisits: [visitJson({ lockVersion: 3 })] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ saunaVisit: visitJson({}) }));
    const repository = new ApiVisitRepository();

    await repository.list();
    await expect(repository.delete("sauna-1")).resolves.toBeUndefined();

    // 削除済みなので lockVersion のキャッシュは残っていない
    await repository.update("sauna-1", { lat: 35, lng: 139 }, form);
    const body = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(body.saunaVisit.lockVersion).toBeUndefined();
  });

  it("履歴IDが無い記録の履歴削除はリクエストを送らない", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const repository = new ApiVisitRepository();

    await expect(
      repository.deleteHistoryEntry({ ...visitJson({}), history: [] }, 0),
    ).rejects.toMatchObject({ code: "missing_history_id" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("履歴削除は記録IDと履歴IDをエスケープして送る", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ saunaVisit: visitJson({}) }));
    const repository = new ApiVisitRepository();

    await repository.deleteHistoryEntry(
      {
        ...visitJson({ id: "sauna/1" }),
        history: [{ id: "history 1", date: "2026-08-02", comment: "" }],
      },
      0,
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/sauna_visits/sauna%2F1/history_entries/history%201",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("ログアウトでCSRFトークンを捨てる", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({
        authenticated: true, user: { email: "owner@example.com" }, csrfToken: "csrf-token",
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ added: 1, skipped: 0 }));
    const repository = new ApiVisitRepository();

    await repository.getSession();
    await repository.logout();
    await repository.importBatch([visitJson({})]);

    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).has("X-CSRF-Token")).toBe(false);
  });

  it("インポートはaddedとskippedをそのまま返す", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ added: 2, skipped: 3 }));
    const repository = new ApiVisitRepository();

    await expect(repository.importBatch([visitJson({})])).resolves.toEqual({ added: 2, skipped: 3 });
  });
});
