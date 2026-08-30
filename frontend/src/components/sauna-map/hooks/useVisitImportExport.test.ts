import { renderHook, act } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { expect, test, vi, describe, afterEach, beforeEach, type MockedFunction } from "vitest";
import { useVisitImportExport } from "./useVisitImportExport";
import { SaunaVisit } from "../types";

/** jsdom は URL.createObjectURL を実装しないため、エクスポートの検証用に差し替える */
function stubObjectUrl() {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:sauna-itta/export");
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  vi.useFakeTimers();
  return { createObjectURL, revokeObjectURL };
}

describe("useVisitImportExport", () => {
  const mockVisits: SaunaVisit[] = [
    { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" },
  ];
  let saveVisitsMock: MockedFunction<(visits: SaunaVisit[]) => boolean>;

  beforeEach(() => {
    saveVisitsMock = vi.fn<(visits: SaunaVisit[]) => boolean>().mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  test("importVisitsFromFile handles invalid JSON", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const file = new File(["invalid json"], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow("Invalid JSON file");
  });

  test("importVisitsFromFile handles invalid schema", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const file = new File(['[{"invalid": "schema"}]'], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(/Imported data is not in the correct format/);
  });

  test("importVisitsFromFile imports new valid visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const newVisit = { id: "2", name: "Sauna B", lat: 35.1, lng: 139.1, comment: "nice", date: "2023-01-02" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 1, skipped: 0, success: true });
    expect(saveVisitsMock).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "2" }),
      expect.objectContaining({ id: "1" }),
    ]));
  });

  test("importVisitsFromFile ignores duplicate visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const duplicateVisit = { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" };
    const file = new File([JSON.stringify([duplicateVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 0, skipped: 1, success: true });
    expect(saveVisitsMock).not.toHaveBeenCalled();
  });

  test("exportVisits creates a download link", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, "setAttribute");
    const { createObjectURL, revokeObjectURL } = stubObjectUrl();

    act(() => {
      result.current.exportVisits();
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith("download", "sauna-visits.json");
    // data: URL は写真付きの記録で長さ上限に当たるため Blob URL を使う
    expect(setAttributeSpy).toHaveBeenCalledWith("href", "blob:sauna-itta/export");
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
    await expect(blob.text()).resolves.toContain("Sauna A");

    // 解放はダウンロード開始を待ってから
    expect(revokeObjectURL).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:sauna-itta/export");

    clickSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

  test("APIインポートは10件ずつ送信する", async () => {
    const importBatch = vi.fn().mockImplementation(async (items: SaunaVisit[]) => ({
      added: items.length,
      skipped: 0,
    }));
    const reload = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, undefined, importBatch, reload),
    );
    const imported = Array.from({ length: 25 }, (_, index) => ({
      id: `api-${index}`,
      name: `Sauna ${index}`,
      lat: 35,
      lng: 139,
      comment: "",
      date: "2026-08-02",
    }));
    const file = new File([JSON.stringify(imported)], "test.json", { type: "application/json" });

    await expect(result.current.importVisitsFromFile(file)).resolves.toEqual({
      added: 25,
      skipped: 0,
      success: true,
    });
    expect(importBatch.mock.calls.map(([items]) => items.length)).toEqual([10, 10, 5]);
    expect(reload).toHaveBeenCalledOnce();
  });

  test("途中経過のトーストは残りのチャンクがある間だけ出す", async () => {
    const importBatch = vi.fn().mockImplementation(async (items: SaunaVisit[]) => ({
      added: items.length,
      skipped: 0,
    }));
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, vi.fn()),
    );
    const imported = Array.from({ length: 65 }, (_, index) => ({
      id: `chunk-${index}`,
      name: `Sauna ${index}`,
      lat: 35,
      lng: 139,
      comment: "",
      date: "2026-08-02",
    }));
    const file = new File([JSON.stringify(imported)], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    // 並行処理のバッチ単位で進捗トーストが出る。最後は完了トーストが伝える
    expect(showToast.mock.calls).toEqual([
      ["50/65件を取り込み中です...", "info"],
      ["データを65件取り込みました。", "success"],
    ]);
  });

  test("1チャンクで収まる場合は途中経過を出さない", async () => {
    const importBatch = vi.fn().mockResolvedValue({ added: 1, skipped: 0 });
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, vi.fn()),
    );
    const file = new File(
      [JSON.stringify([{ id: "single", name: "Sauna", lat: 35, lng: 139, comment: "", date: "2026-08-02" }])],
      "test.json",
      { type: "application/json" },
    );
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith("データを1件取り込みました。", "success");
  });

  test("サーバーがスキップした件数を完了トーストで伝える", async () => {
    const importBatch = vi.fn().mockResolvedValue({ added: 1, skipped: 1 });
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, vi.fn()),
    );
    const imported = [
      { id: "new-1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2026-08-02" },
      { id: "new-2", name: "Sauna B", lat: 35, lng: 139, comment: "", date: "2026-08-02" },
    ];
    const file = new File([JSON.stringify(imported)], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenLastCalledWith(
      "データを1件取り込みました。（1件はすでに登録済みのためスキップしました）",
      "success",
    );
  });

  test("画面上の記録と重複しただけの場合もスキップ件数を伝える", async () => {
    const importBatch = vi.fn();
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, vi.fn()),
    );
    const file = new File(
      [JSON.stringify([{ id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" }])],
      "test.json",
      { type: "application/json" },
    );
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(importBatch).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledExactlyOnceWith(
      "1件はすでに登録済みのため、新しく追加されたデータはありません。",
      "info",
    );
  });

  test("APIインポートが途中で失敗した場合は確定済み件数を通知して再読み込みする", async () => {
    const importBatch = vi.fn()
      // CONCURRENCY_LIMIT (5) chunks (50 items) per batch. To test partial failure within or across batches,
      // we can reject the first chunk. If it rejects in Promise.all, `added` remains 0.
      // If we want it to report some added, we need a previous batch to succeed, or for some parallel tasks to succeed.
      // Promise.all rejects immediately, so results of parallel successes are lost in that batch.
      // We will make the first batch of 5 chunks succeed, and the second batch fail.
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockRejectedValueOnce(new Error("サーバーへ接続できません。"));
    const reload = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, reload),
    );
    const imported = Array.from({ length: 65 }, (_, index) => ({
      id: `partial-${index}`,
      name: `Sauna ${index}`,
      lat: 35,
      lng: 139,
      comment: "",
      date: "2026-08-02",
    }));
    const file = new File([JSON.stringify(imported)], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(reload).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenLastCalledWith(
      "データの取り込みに失敗しました。50件は取り込み済みです。サーバーへ接続できません。",
      "error",
    );
  });

  test("APIインポート失敗後の再読み込みにも失敗した場合はエラーメッセージに追記する", async () => {
    const importBatch = vi.fn().mockRejectedValueOnce(new Error("サーバーへ接続できません。"));
    const reloadError = new Error("再読み込み失敗");
    const reload = vi.fn().mockRejectedValueOnce(reloadError);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, reload),
    );
    const imported = Array.from({ length: 1 }, (_, index) => ({
      id: `fail-${index}`,
      name: `Sauna ${index}`,
      lat: 35,
      lng: 139,
      comment: "",
      date: "2026-08-02",
    }));
    const file = new File([JSON.stringify(imported)], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(reload).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith(
      "データの取り込みに失敗しました。サーバーへ接続できません。（再読み込みにも失敗しました）",
      "error",
    );
  });

  test("保存に失敗した場合はエラートーストを表示する", async () => {
    const saveVisitsFail = vi.fn().mockReturnValue(false);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, saveVisitsFail, showToast)
    );

    const newVisit = { id: "3", name: "Sauna C", lat: 35.2, lng: 139.2, comment: "failed", date: "2023-01-03" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenCalledWith("画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。", "error");
  });

  test("JSONの読み込みなどそれ以外のエラーの場合はエラートーストを表示する", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, saveVisitsMock, showToast)
    );
    const file = new File(["invalid json"], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });
    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });
    expect(showToast).toHaveBeenCalledWith("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
  });
});
