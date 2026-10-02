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

  it("想定外の形式のセッション応答はRepositoryErrorにする", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      authenticated: "yes",
      csrfToken: 1,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const repository = new ApiVisitRepository();

    await expect(repository.getSession()).rejects.toMatchObject({ code: "invalid_response" });
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

  it("エラー詳細(details)が含まれる場合、RepositoryErrorに保持する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      error: { code: "validation_failed", message: "入力内容に誤りがあります。", details: { name: ["を入力してください"] } },
    }), { status: 422, headers: { "Content-Type": "application/json" } }));
    const repository = new ApiVisitRepository();

    const expected = {
      code: "validation_failed",
      status: 422,
      message: "入力内容に誤りがあります。",
      details: { name: ["を入力してください"] },
    } satisfies Partial<RepositoryError>;
    await expect(repository.list()).rejects.toMatchObject(expected);
  });

  it("通信自体の失敗はnetwork_errorとして案内する", async () => {
    const error = new TypeError("Failed to fetch");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = new ApiVisitRepository();

    await expect(repository.list()).rejects.toMatchObject({
      code: "network_error",
      message: "サーバーへ接続できません。通信状態を確認してください。",
    });

    // どのリクエストが失敗したかをログから追えるようにする
    expect(consoleSpy).toHaveBeenCalledWith("Failed to request GET /api/v1/sauna_visits:", error);
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

  it("更新時は渡された記録のlockVersionを送る", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ saunaVisit: visitJson({ lockVersion: 8 }) }));
    const repository = new ApiVisitRepository();

    const updated = await repository.update(visitJson({ lockVersion: 7 }), { lat: 35, lng: 139 }, form);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.saunaVisit.lockVersion).toBe(7);
    expect(body.saunaVisit.tags).toEqual(["外気浴", "水風呂"]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/sauna_visits/sauna-1");
    expect(updated.lockVersion).toBe(8);
  });

  it("lockVersionの無い記録の更新はリクエストを送らない", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const repository = new ApiVisitRepository();

    await expect(
      repository.update(visitJson({ lockVersion: undefined }), { lat: 35, lng: 139 }, form),
    ).rejects.toMatchObject({ code: "missing_lock_version" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("削除は204を本文なしとして扱う", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 204 }));
    const repository = new ApiVisitRepository();

    await expect(repository.delete("sauna-1")).resolves.toBeUndefined();
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

  it("一覧の応答が記録の形式でなければinvalid_responseとして扱う", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ saunaVisits: [{ id: "sauna-1", name: "北欧" }] }));
    const repository = new ApiVisitRepository();

    await expect(repository.list()).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("作成の応答にsaunaVisitが無ければinvalid_responseとして扱う", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const repository = new ApiVisitRepository();

    const promise = repository.create({ lat: 35, lng: 139 }, form);
    await expect(promise).rejects.toBeInstanceOf(RepositoryError);
    await expect(promise).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("インポート結果に件数が無ければinvalid_responseとして扱う", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ added: 1 }));
    const repository = new ApiVisitRepository();

    await expect(repository.importBatch([visitJson({})])).rejects.toMatchObject({ code: "invalid_response" });
  });

  describe("prepareExport", () => {
    const API_IMAGE = "/api/v1/images/signed-1";

    function imageResponse(bytes: string, status = 200) {
      return new Response(bytes, { status, headers: { "Content-Type": "image/png" } });
    }

    it("画像エンドポイントの写真を data URL へ置き換え、同じ URL は一度だけ取得する", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("png-bytes"));
      const repository = new ApiVisitRepository();
      const visit = visitJson({
        image: API_IMAGE,
        history: [
          { id: "h1", date: "2026-08-01", comment: "", image: "data:image/png;base64,AAAA" },
          { id: "h2", date: "2026-08-02", comment: "", image: API_IMAGE },
        ],
      });

      const [exported] = await repository.prepareExport([visit]);

      // 記録本体の image は最新履歴の写しのため、取得は1回で足りる
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toBe(API_IMAGE);
      expect(fetchMock.mock.calls[0][1]?.credentials).toBe("same-origin");
      expect(exported.image).toMatch(/^data:image\/png;base64,/);
      expect(exported.history?.[1].image).toBe(exported.image);
      // もともと data URL の写真には触らない
      expect(exported.history?.[0].image).toBe("data:image/png;base64,AAAA");
      // 元の記録（画面の状態）は書き換えない
      expect(visit.image).toBe(API_IMAGE);
    });

    it("写真のない記録は取得せずにそのまま返す", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch");
      const repository = new ApiVisitRepository();
      const visit = visitJson({});

      await expect(repository.prepareExport([visit])).resolves.toEqual([visit]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("写真を1枚でも取得できなければ、欠けたバックアップを作らずに失敗する", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("", 404));
      const repository = new ApiVisitRepository();

      await expect(repository.prepareExport([visitJson({ image: API_IMAGE })])).rejects.toMatchObject({
        code: "export_image_failed",
        status: 404,
      });
    });

    it("写真の取得が401ならセッションの喪失（unauthenticated）として伝える", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(imageResponse("", 401));
      const repository = new ApiVisitRepository();

      await expect(repository.prepareExport([visitJson({ image: API_IMAGE })])).rejects.toMatchObject({
        code: "unauthenticated",
        status: 401,
      });
    });

    it("通信できないときは network_error にする", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
      const repository = new ApiVisitRepository();

      await expect(repository.prepareExport([visitJson({ image: API_IMAGE })])).rejects.toBeInstanceOf(RepositoryError);
      await expect(repository.prepareExport([visitJson({ image: API_IMAGE })])).rejects.toMatchObject({
        code: "network_error",
      });
    });
  });
});

