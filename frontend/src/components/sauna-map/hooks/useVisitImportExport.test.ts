import { renderHook, act } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { expect, test, vi, describe, beforeEach, type MockedFunction } from "vitest";
import { useVisitImportExport } from "./useVisitImportExport";
import { SaunaVisit } from "../types";

describe("useVisitImportExport", () => {
  const mockVisits: SaunaVisit[] = [
    { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" },
  ];
  let saveVisitsMock: MockedFunction<(visits: SaunaVisit[]) => boolean>;

  beforeEach(() => {
    saveVisitsMock = vi.fn<(visits: SaunaVisit[]) => boolean>().mockReturnValue(true);
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

  test("exportVisits creates a download link", () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, "setAttribute");

    act(() => {
      result.current.exportVisits();
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith("download", "sauna-visits.json");
    expect(setAttributeSpy).toHaveBeenCalledWith("href", expect.stringContaining("data:application/json;charset=utf-8,"));

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
    const imported = Array.from({ length: 25 }, (_, index) => ({
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

    // 3チャンク送っても途中経過は2回まで。最後は完了トーストが伝える
    expect(showToast.mock.calls).toEqual([
      ["10/25件を取り込み中です...", "info"],
      ["20/25件を取り込み中です...", "info"],
      ["データを25件取り込みました。", "success"],
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
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockRejectedValueOnce(new Error("サーバーへ接続できません。"));
    const reload = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(mockVisits, undefined, showToast, importBatch, reload),
    );
    const imported = Array.from({ length: 15 }, (_, index) => ({
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
      "データの取り込みに失敗しました。10件は取り込み済みです。サーバーへ接続できません。",
      "error",
    );
  });
});
