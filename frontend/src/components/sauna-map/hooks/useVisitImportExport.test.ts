import { renderHook, act } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { expect, test, vi, describe, afterEach, beforeEach, type MockedFunction } from "vitest";
import {
  IMPORT_MAX_BATCH_BYTES,
  ImportFileError,
  chunkVisitsForImport,
  dropApiImageUrls,
  useVisitImportExport,
} from "./useVisitImportExport";
import { SaunaVisit } from "../types";
import { RepositoryError, type ImportResult } from "../repositories";

/** jsdom は URL.createObjectURL を実装しないため、エクスポートの検証用に差し替える */
function stubObjectUrl() {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:sauna-itta/export");
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  vi.useFakeTimers();
  return { createObjectURL, revokeObjectURL };
}

/** localモードと同じく記録をそのまま書き出す prepareExport */
const passThroughExport = async (visits: SaunaVisit[]) => visits;

describe("useVisitImportExport", () => {
  const mockVisits: SaunaVisit[] = [
    { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" },
  ];
  // 取り込みは両モードとも Repository の importBatch が唯一の保存経路
  let importBatchMock: MockedFunction<(visits: SaunaVisit[]) => Promise<ImportResult>>;
  let reloadMock: MockedFunction<() => Promise<boolean>>;

  beforeEach(() => {
    importBatchMock = vi
      .fn<(visits: SaunaVisit[]) => Promise<ImportResult>>()
      .mockImplementation(async (items) => ({ added: items.length, skipped: 0 }));
    reloadMock = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  test("importVisitsFromFile handles invalid JSON", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const file = new File(["invalid json"], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(ImportFileError);
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(
      "JSONの読み込みに失敗しました。JSON形式ではありません。エクスポートしたファイルを指定してください。",
    );
  });

  test("importVisitsFromFile handles invalid schema", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const file = new File(['[{"invalid": "schema"}]'], "test.json", { type: "application/json" });
    // どの記録のどの項目を直せばよいかを伝える
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(
      /^JSONの読み込みに失敗しました。1件目の記録の「\w+」の形式が正しくありません（ほかに\d+か所）。$/,
    );
  });

  test("importVisitsFromFile は問題のある記録の位置と項目を伝える", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const valid = { id: "2", name: "Sauna B", lat: 35.1, lng: 139.1, comment: "", date: "2023-01-02" };
    const broken = { ...valid, id: "3", lat: "35.1" };
    const file = new File([JSON.stringify([valid, broken])], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(
      "JSONの読み込みに失敗しました。2件目の記録の「lat」の形式が正しくありません。",
    );
  });

  test("importVisitsFromFile は配列でないファイルをその旨で伝える", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const file = new File(['{"id": "1"}'], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(
      "JSONの読み込みに失敗しました。サウナ記録の配列ではありません。エクスポートしたファイルを指定してください。",
    );
  });

  test("importVisitsFromFile imports new valid visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const newVisit = { id: "2", name: "Sauna B", lat: 35.1, lng: 139.1, comment: "nice", date: "2023-01-02" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 1, skipped: 0, reloaded: true, droppedImages: 0 });
    expect(importBatchMock).toHaveBeenCalledWith([expect.objectContaining({ id: "2" })]);
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  test("importVisitsFromFile ignores duplicate visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const duplicateVisit = { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" };
    const file = new File([JSON.stringify([duplicateVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 0, skipped: 1, reloaded: true, droppedImages: 0 });
    expect(importBatchMock).not.toHaveBeenCalled();
  });

  test("exportVisits creates a download link", async () => {
    const { result } = renderHook(() => useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, "setAttribute");
    const { createObjectURL, revokeObjectURL } = stubObjectUrl();

    await act(async () => {
      await result.current.exportVisits();
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
    const reload = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reload),
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
      reloaded: true,
      droppedImages: 0,
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
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reloadMock, showToast),
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
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reloadMock, showToast),
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
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reloadMock, showToast),
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
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reloadMock, showToast),
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
    const reload = vi.fn().mockResolvedValue(true);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reload, showToast),
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

  test("同時に行われた別の操作との重複 (409 duplicate) はサーバーの文言で伝える", async () => {
    const importBatch = vi.fn().mockRejectedValue(
      new RepositoryError("同時に行われた別の操作と重複したため保存できませんでした。", "duplicate", 409),
    );
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, vi.fn().mockResolvedValue(true), showToast),
    );
    const file = new File(
      [JSON.stringify([{ id: "conflict-1", name: "Sauna", lat: 35, lng: 139, comment: "", date: "2026-08-02" }])],
      "test.json",
      { type: "application/json" },
    );
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenLastCalledWith(
      "データの取り込みに失敗しました。同時に行われた別の操作と重複したため保存できませんでした。",
      "error",
    );
  });

  test("APIインポート失敗後の再読み込みにも失敗した場合はエラーメッセージに追記する", async () => {
    const importBatch = vi.fn().mockRejectedValueOnce(new Error("サーバーへ接続できません。"));
    // useVisitSession の reload は失敗を例外ではなく false で返す
    const reload = vi.fn().mockResolvedValueOnce(false);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reload, showToast),
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

  test("取り込み後の再読み込みに失敗した場合は完了トーストに追記する", async () => {
    const reload = vi.fn().mockResolvedValueOnce(false);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reload, showToast),
    );
    const newVisit = { id: "2", name: "Sauna B", lat: 35.1, lng: 139.1, comment: "", date: "2023-01-02" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenLastCalledWith(
      "データを1件取り込みました。（画面の再読み込みに失敗したため、表示が最新でない可能性があります）",
      "success",
    );
  });

  test("localStorageの容量超過はRepositoryの例外としてエラートーストに出る", async () => {
    // LocalVisitRepository#persist が投げるメッセージ。取り込みの成否は戻り値ではなく
    // 例外で伝わるため、ここが localモードの保存失敗を利用者へ伝える唯一の経路。
    const importBatch = vi.fn().mockRejectedValue(new Error("ブラウザへの保存に失敗しました。"));
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reloadMock, showToast)
    );

    const newVisit = { id: "3", name: "Sauna C", lat: 35.2, lng: 139.2, comment: "failed", date: "2023-01-03" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).toHaveBeenCalledWith(
      "データの取り込みに失敗しました。ブラウザへの保存に失敗しました。",
      "error",
    );
  });

  test("JSONの読み込みなどそれ以外のエラーの場合はエラートーストを表示する", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock, showToast)
    );
    const file = new File(["invalid json"], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });
    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });
    expect(showToast).toHaveBeenCalledWith(
      "JSONの読み込みに失敗しました。JSON形式ではありません。エクスポートしたファイルを指定してください。",
      "error",
    );
  });

  test("ファイルの読み込みに失敗した場合はエラートーストを表示する", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock, showToast)
    );

    // FileReader をモック化してエラーを発生させる
    const originalFileReader = window.FileReader;
    class MockFileReader {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      error = new Error("Failed to read file");
      readAsText() {
        setTimeout(() => {
          this.onerror();
        }, 0);
      }
    }
    Object.defineProperty(window, "FileReader", { value: MockFileReader, writable: true, configurable: true });

    try {
      const file = new File(["dummy"], "test.json", { type: "application/json" });
      const input = document.createElement("input");
      Object.defineProperty(input, "files", { value: [file] });

      await act(async () => {
        await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
      });

      expect(showToast).toHaveBeenCalledWith("JSONの読み込みに失敗しました。ファイルを読み込めませんでした。", "error");
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  test("ファイルが選択されていない場合は何もしない", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock, showToast)
    );
    const input = document.createElement("input");

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    expect(showToast).not.toHaveBeenCalled();
    expect(result.current.importing).toBe(false);
  });

  test("APIインポートが途中で失敗し、エラーが Error インスタンスでない場合のメッセージを確認する", async () => {
    const importBatch = vi.fn()
      .mockResolvedValueOnce({ added: 10, skipped: 0 })
      .mockRejectedValueOnce("Not an error object");
    const reload = vi.fn().mockResolvedValue(true);
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatch, passThroughExport, reload, showToast),
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
      "データの取り込みに失敗しました。10件は取り込み済みです。サーバーへの取り込みに失敗しました。",
      "error",
    );
  });

  test("エクスポートに失敗したらトーストで伝え、ファイルは書き出さない", async () => {
    const showToast = vi.fn();
    const prepareExport = vi.fn().mockRejectedValue(
      new RepositoryError("写真を取得できなかったため、エクスポートを中止しました。", "export_image_failed", 404),
    );
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, prepareExport, reloadMock, showToast),
    );

    await act(async () => {
      await result.current.exportVisits();
    });

    expect(clickSpy).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("写真を取得できなかったため、エクスポートを中止しました。", "error");
    expect(result.current.exporting).toBe(false);
    clickSpy.mockRestore();
  });

  test("画像URLのまま書き出された写真は外して取り込み、枚数を完了トーストで伝える", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useVisitImportExport(() => mockVisits, importBatchMock, passThroughExport, reloadMock, showToast),
    );
    const imported = {
      id: "with-api-image",
      name: "Sauna C",
      lat: 35,
      lng: 139,
      comment: "",
      date: "2026-08-02",
      image: "/api/v1/images/signed-1",
      history: [{ date: "2026-08-02", comment: "", image: "/api/v1/images/signed-1" }],
    };
    const file = new File([JSON.stringify([imported])], "test.json", { type: "application/json" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await result.current.handleImportData({ target: input } as ChangeEvent<HTMLInputElement>);
    });

    const [sent] = importBatchMock.mock.calls[0][0];
    expect(sent.image).toBeUndefined();
    expect(sent.history?.[0].image).toBeUndefined();
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("写真1枚は画像URLとして書き出されていた"), "success");
  });
});

describe("dropApiImageUrls", () => {
  test("画像エンドポイントの URL だけを外し、記録本体の写しも最新履歴へ揃える", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "Sauna A",
      lat: 35,
      lng: 139,
      comment: "latest",
      date: "2026-08-02",
      image: "/api/v1/images/latest",
      visitCount: 3,
      history: [
        { date: "2026-08-01", comment: "first", image: "data:image/png;base64,AAAA" },
        { date: "2026-08-02", comment: "latest", image: "/api/v1/images/latest" },
      ],
    };

    const { visits, droppedImages } = dropApiImageUrls([visit]);

    expect(droppedImages).toBe(1);
    expect(visits[0].image).toBeUndefined();
    expect(visits[0].history?.[0].image).toBe("data:image/png;base64,AAAA");
    expect(visits[0].history?.[1].image).toBeUndefined();
    // 旧形式から引き継いだ訪問回数は取り込みでは維持する
    expect(visits[0].visitCount).toBe(3);
  });

  test("外す写真がない記録は同じ参照のまま返す", () => {
    const visit: SaunaVisit = {
      id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2026-08-02",
      history: [{ date: "2026-08-02", comment: "" }],
    };
    const { visits, droppedImages } = dropApiImageUrls([visit]);
    expect(droppedImages).toBe(0);
    expect(visits[0]).toBe(visit);
  });
});

describe("chunkVisitsForImport", () => {
  const visit = (id: string, comment = ""): SaunaVisit => ({ id, name: id, lat: 35, lng: 139, comment, date: "2026-08-02" });
  const bytesOf = (item: SaunaVisit) => new TextEncoder().encode(JSON.stringify(item)).byteLength;

  test("件数の上限で区切る", () => {
    const visits = Array.from({ length: 25 }, (_, index) => visit(`v${index}`));
    expect(chunkVisitsForImport(visits, 10, Infinity).map((chunk) => chunk.length)).toEqual([10, 10, 5]);
  });

  test("件数に収まっていてもバイト数の上限を超える前に区切る", () => {
    // 写真入りの記録を想定した大きな記録。3 件で上限を超えるため 2 件ずつに分かれる
    const large = Array.from({ length: 5 }, (_, index) => visit(`v${index}`, "x".repeat(1000)));
    const limit = bytesOf(large[0]) * 2 + 10;
    expect(chunkVisitsForImport(large, 10, limit).map((chunk) => chunk.map((item) => item.id))).toEqual([
      ["v0", "v1"],
      ["v2", "v3"],
      ["v4"],
    ]);
  });

  test("マルチバイト文字は UTF-8 のバイト数で数える", () => {
    const japanese = [visit("a", "あ".repeat(100)), visit("b", "あ".repeat(100))];
    // 文字数（length）で数えると 2 件とも 1 チャンクに収まってしまう上限
    const limit = JSON.stringify(japanese[0]).length * 2 + 10;
    expect(chunkVisitsForImport(japanese, 10, limit)).toHaveLength(2);
  });

  test("1 件だけで上限を超える記録は単独のチャンクとして送る", () => {
    const visits = [visit("small"), visit("huge", "x".repeat(5000)), visit("small2")];
    const limit = bytesOf(visits[0]) * 3;
    expect(chunkVisitsForImport(visits, 10, limit).map((chunk) => chunk.map((item) => item.id))).toEqual([
      ["small"],
      ["huge"],
      ["small2"],
    ]);
  });

  test("既定のバイト数の上限は Cloud Run のリクエスト上限（32MiB）より十分小さい", () => {
    expect(IMPORT_MAX_BATCH_BYTES).toBeLessThanOrEqual(16 * 1024 * 1024);
  });

  test("空の配列はチャンクを作らない", () => {
    expect(chunkVisitsForImport([])).toEqual([]);
  });
});
