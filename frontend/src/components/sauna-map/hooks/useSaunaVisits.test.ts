import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaunaVisit } from "../types";
import type { VisitRepository } from "../repositories";
import { RepositoryError } from "../repositories";
import { useSaunaVisits } from "./useSaunaVisits";
import { VISITS_STORAGE_KEY } from "../utils";

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
    prepareExport: vi.fn(async (visits: SaunaVisit[]) => visits),
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

  it("更新は渡された記録（lockVersion込み）をRepositoryへ渡し、成功後に画面状態を置き換える", async () => {
    const loaded = [{ ...initialVisits[0], lockVersion: 4 }];
    const source = repository({ list: vi.fn().mockResolvedValue(loaded) });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editVisit(loaded[0], { lat: 35, lng: 139 }, {
        name: "更新", comment: "", image: "", date: "2026-08-02", rating: 4,
        tagsText: "", status: "visited", area: "東京", appendHistory: false,
      });
    });
    expect(source.update).toHaveBeenCalledWith(loaded[0], { lat: 35, lng: 139 }, expect.anything());
    expect(result.current.visits[0].name).toBe("更新済み");
  });

  it("409競合時は再読み込みを案内して状態を変更しない", async () => {
    const showToast = vi.fn();
    const source = repository({
      update: vi.fn().mockRejectedValue(new RepositoryError("競合", "conflict", 409)),
    });
    const { result } = renderHook(() => useSaunaVisits(showToast, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editVisit(initialVisits[0], { lat: 35, lng: 139 }, {
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

  it("初期データ取得 (fetch) 時にエラーが発生した場合、loadErrorにエラーメッセージが設定されること", async () => {
    const errorMsg = "Failed to load visits";
    const source = repository({
      list: vi.fn().mockRejectedValue(new Error(errorMsg)),
    });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe(errorMsg);
    expect(result.current.visits).toEqual([]);
    expect(source.list).toHaveBeenCalledOnce();
  });

  it("Error以外で読み込みに失敗した場合は、保存ではなく読み込みの失敗として伝える", async () => {
    const source = repository({ list: vi.fn().mockRejectedValue("unknown") });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe("記録の読み込みに失敗しました。");
  });

  it("並行した保存の片方が終わっても、もう片方が終わるまで saving を保つこと", async () => {
    let finishDelete!: () => void;
    const source = repository({
      delete: vi.fn().mockReturnValue(new Promise<void>((resolve) => { finishDelete = resolve; })),
    });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pendingDelete!: Promise<unknown>;
    act(() => {
      pendingDelete = result.current.deleteVisit("1");
    });
    await act(async () => {
      await result.current.removeHistoryEntry(initialVisits[0], 0);
    });
    expect(result.current.saving).toBe(true);

    await act(async () => {
      finishDelete();
      await pendingDelete;
    });
    expect(result.current.saving).toBe(false);
  });

  it("localモードは別タブの保存 (storage イベント) を受けて記録を読み直す", async () => {
    const reloaded = [...initialVisits, { ...initialVisits[0], id: "other-tab" }];
    const list = vi.fn().mockResolvedValueOnce(initialVisits).mockResolvedValue(reloaded);
    const source = repository({ dataSource: "local", list });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 無関係なキーの変更では読み直さない
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    });
    expect(list).toHaveBeenCalledOnce();

    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: VISITS_STORAGE_KEY }));
    });
    await waitFor(() => expect(result.current.visits).toEqual(reloaded));
  });

  it("apiモードは storage イベントで読み直さない", async () => {
    const source = repository();
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: VISITS_STORAGE_KEY }));
    });
    expect(source.list).toHaveBeenCalledOnce();
  });

  it("ログアウト後は記録を消し、セッションを取り直して新しい CSRF トークンを持つ", async () => {
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({ authenticated: true, user: { email: "owner@example.com" }, csrfToken: "before-logout" })
      .mockResolvedValueOnce({ authenticated: false, user: null, csrfToken: "after-logout" });
    const source = repository({ getSession });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.visits).toEqual(initialVisits));

    let loggedOut: boolean | undefined;
    await act(async () => {
      loggedOut = await result.current.logout();
    });

    expect(loggedOut).toBe(true);
    expect(source.logout).toHaveBeenCalledOnce();
    expect(result.current.visits).toEqual([]);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.csrfToken).toBe("after-logout");
  });

  it("ログアウトに失敗したらトーストで伝え、ログイン状態と記録を残す", async () => {
    const showToast = vi.fn();
    const source = repository({ logout: vi.fn().mockRejectedValue(new Error("通信失敗")) });
    const { result } = renderHook(() => useSaunaVisits(showToast, source));
    await waitFor(() => expect(result.current.visits).toEqual(initialVisits));

    let loggedOut: boolean | undefined;
    await act(async () => {
      loggedOut = await result.current.logout();
    });

    expect(loggedOut).toBe(false);
    expect(showToast).toHaveBeenCalledWith("通信失敗", "error");
    expect(result.current.authenticated).toBe(true);
    expect(result.current.visits).toEqual(initialVisits);
  });

  it("エクスポートは Repository の prepareExport を通した記録を書き出す", async () => {
    const prepareExport = vi.fn(async (visits: SaunaVisit[]) =>
      visits.map((visit) => ({ ...visit, image: "data:image/png;base64,AAAA" })),
    );
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:sauna-itta/export");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const source = repository({ prepareExport });
    const { result } = renderHook(() => useSaunaVisits(undefined, source));
    await waitFor(() => expect(result.current.visits).toEqual(initialVisits));
    // Blob URL の遅延解放を、スタブを外す前に済ませる
    vi.useFakeTimers();

    await act(async () => {
      await result.current.exportVisits();
    });
    vi.runAllTimers();
    vi.useRealTimers();

    expect(prepareExport).toHaveBeenCalledWith(initialVisits);
    await expect(createObjectURL.mock.calls[0][0].text()).resolves.toContain("data:image/png;base64,AAAA");
    expect(result.current.exporting).toBe(false);

    clickSpy.mockRestore();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });
});
