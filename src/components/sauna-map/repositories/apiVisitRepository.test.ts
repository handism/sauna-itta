import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiVisitRepository } from "./apiVisitRepository";
import { RepositoryError } from "./types";

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
});
