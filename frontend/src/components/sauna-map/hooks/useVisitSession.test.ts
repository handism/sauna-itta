import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SaunaVisit } from "../types";
import { RepositoryError, type VisitRepository } from "../repositories";
import { LOAD_ERROR_FALLBACK, toUserMessage, useVisitSession } from "./useVisitSession";

const loadedVisits: SaunaVisit[] = [
  { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2026-01-01" },
];

function repository(overrides: Partial<VisitRepository> = {}): VisitRepository {
  return {
    dataSource: "api",
    getSession: vi.fn().mockResolvedValue({ authenticated: true, user: { email: "owner@example.com" }, csrfToken: "token" }),
    logout: vi.fn(),
    list: vi.fn().mockResolvedValue(loadedVisits),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteHistoryEntry: vi.fn(),
    importBatch: vi.fn(),
    ...overrides,
  };
}

describe("toUserMessage", () => {
  it("409 は楽観ロックの競合として再読み込みを案内すること", () => {
    expect(toUserMessage(new RepositoryError("conflict", "conflict", 409), "fallback")).toContain("再読み込み");
  });

  it("Error 以外は既定の文言にすること", () => {
    expect(toUserMessage("unknown", "fallback")).toBe("fallback");
  });
});

describe("useVisitSession", () => {
  it("ログイン済みならセッションを反映して記録を読み込むこと", async () => {
    const onVisitsLoaded = vi.fn();
    const source = repository();
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.csrfToken).toBe("token");
    expect(result.current.user).toEqual({ email: "owner@example.com" });
    expect(onVisitsLoaded).toHaveBeenCalledWith(loadedVisits);
  });

  it("未ログインなら記録を読み込まないこと", async () => {
    const onVisitsLoaded = vi.fn();
    const source = repository({
      getSession: vi.fn().mockResolvedValue({ authenticated: false, user: null, csrfToken: "token" }),
    });
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
    expect(source.list).not.toHaveBeenCalled();
  });

  it("skipInitialList のときは初回の list() を省くこと", async () => {
    const source = repository();
    const onVisitsLoaded = vi.fn();
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded, skipInitialList: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(source.list).not.toHaveBeenCalled();
  });

  it("一覧だけ失敗した場合もセッションは反映し、読み込みエラーとして伝えること", async () => {
    const source = repository({ list: vi.fn().mockRejectedValue("network") });
    const onVisitsLoaded = vi.fn();
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.loadError).toBe(LOAD_ERROR_FALLBACK);
  });

  it("reload は前回のエラーを消して読み込み直すこと", async () => {
    const onVisitsLoaded = vi.fn();
    const list = vi.fn().mockRejectedValueOnce(new Error("一時的な失敗")).mockResolvedValue(loadedVisits);
    // Repository はレンダリングの外で作る（参照が変わると初回読み込みがやり直される）
    const source = repository({ list });
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded }));
    await waitFor(() => expect(result.current.loadError).toBe("一時的な失敗"));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.loadError).toBeNull();
    expect(onVisitsLoaded).toHaveBeenCalledWith(loadedVisits);
  });

  it("clearSession で未ログイン状態へ戻すこと", async () => {
    const source = repository();
    const onVisitsLoaded = vi.fn();
    const { result } = renderHook(() => useVisitSession(source, { onVisitsLoaded }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.clearSession());

    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
