import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaunaVisit } from "../types";
import type { VisitRepository } from "../repositories";
import { RepositoryError } from "../repositories";
import { useSaunaVisits } from "./useSaunaVisits";

const initialVisits: SaunaVisit[] = [
  { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2026-01-01" },
];

function repository(overrides: Partial<VisitRepository> = {}): VisitRepository {
  return {
    dataSource: "api",
    getSession: vi.fn().mockResolvedValue({ authenticated: true, user: { email: "owner@example.com" }, csrfToken: "token" }),
    logout: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue(initialVisits),
    create: vi.fn().mockResolvedValue({ ...initialVisits[0], id: "2" }),
    update: vi.fn().mockResolvedValue({ ...initialVisits[0], name: "更新済み" }),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteHistoryEntry: vi.fn().mockResolvedValue(initialVisits[0]),
    importBatch: vi.fn().mockResolvedValue({ added: 0, skipped: 0 }),
    ...overrides,
  };
}

describe("useSaunaVisits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("セッション確認後にAPIから記録を読み込む", async () => {
    const source = repository();
    const { result } = renderHook(() => useSaunaVisits(undefined, source));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.visits).toEqual(initialVisits);
    expect(source.list).toHaveBeenCalledOnce();
  });

  it("作成成功後だけ画面状態へ反映する", async () => {
    const source = repository();
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addVisit({ lat: 35, lng: 139 }, {
        name: "新規", comment: "", image: "", date: "2026-08-02", rating: 4,
        tagsText: "", status: "visited", area: "東京", appendHistory: false,
      });
    });
    expect(result.current.visits[0].id).toBe("2");
  });

  it("409競合時は再読み込みを案内して状態を変更しない", async () => {
    const showToast = vi.fn();
    const source = repository({
      update: vi.fn().mockRejectedValue(new RepositoryError("競合", "conflict", 409)),
    });
    const { result } = renderHook(() => useSaunaVisits(showToast, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editVisit("1", { lat: 35, lng: 139 }, {
        name: "更新", comment: "", image: "", date: "2026-08-02", rating: 4,
        tagsText: "", status: "visited", area: "東京", appendHistory: false,
      });
    });
    expect(result.current.visits).toEqual(initialVisits);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("再読み込み"), "error");
  });

  it("reload時にエラーが発生した場合、loadErrorが設定される", async () => {
    const source = repository({
      list: vi.fn()
        .mockResolvedValueOnce(initialVisits) // First call on mount
        .mockRejectedValueOnce(new Error("Network Error")), // Second call on reload
    });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.loadError).toBe("Network Error");
    expect(result.current.loading).toBe(false);
  });

  it("初期読み込み時にエラーが発生した場合、loadErrorが設定される", async () => {
    const source = repository({
      list: vi.fn().mockRejectedValue(new Error("Initial Load Error")),
    });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe("Initial Load Error");
    expect(result.current.visits).toEqual([]); // since we default to empty array
  });

  it("409以外のエラー時はメッセージをトーストで伝え、状態を変更しない", async () => {
    const showToast = vi.fn();
    const source = repository({
      create: vi.fn().mockRejectedValue(new Error("ネットワークエラー")),
    });
    const { result } = renderHook(() => useSaunaVisits(showToast, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let addResult;
    await act(async () => {
      addResult = await result.current.addVisit({ lat: 35, lng: 139 }, {
        name: "新規", comment: "", image: "", date: "2026-08-02", rating: 4,
        tagsText: "", status: "visited", area: "東京", appendHistory: false,
      });
    });

    expect(result.current.visits).toEqual(initialVisits);
    expect(showToast).toHaveBeenCalledWith("ネットワークエラー", "error");
    expect(addResult).toEqual({ success: false, newVisit: undefined });
  });
});
