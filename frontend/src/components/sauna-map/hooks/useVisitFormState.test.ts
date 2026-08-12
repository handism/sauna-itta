import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVisitFormState, UseVisitFormStateOptions } from "./useVisitFormState";
import { SaunaVisit } from "../types";
import * as utils from "../utils";

describe("useVisitFormState", () => {
  const mockVisit: SaunaVisit = {
    id: "v1",
    name: "サウナしきじ",
    lat: 34.95,
    lng: 138.4,
    date: "2023-05-01",
    comment: "最高",
    rating: 5,
  };

  let defaultOptions: UseVisitFormStateOptions;

  beforeEach(() => {
    defaultOptions = {
      startCreate: vi.fn(),
      startEdit: vi.fn(),
      cancelEdit: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it("初期状態でデフォルトのフォーム状態を保持していること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    expect(result.current.form.name).toBe("");
    expect(result.current.imageUploading).toBe(false);
  });

  it("startNewVisit を呼ぶと startCreate が呼び出されフォームがリセットされること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    act(() => {
      result.current.startNewVisit();
    });

    expect(defaultOptions.startCreate).toHaveBeenCalled();
    expect(result.current.form.name).toBe("");
  });

  it("startEditing を呼ぶと startEdit が呼び出され指定データがフォームに反映されること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    act(() => {
      result.current.startEditing(mockVisit);
    });

    expect(defaultOptions.startEdit).toHaveBeenCalledWith(mockVisit);
    expect(result.current.form.name).toBe("サウナしきじ");
  });

  it("handleImageFile で画像圧縮に失敗したときにエラーのトーストが表示されること", async () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    const spy = vi.spyOn(utils, "compressAndGetBase64").mockRejectedValue(new Error("compression failed"));

    await act(async () => {
      await result.current.handleImageFile(new File([""], "test.png"));
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(defaultOptions.showToast).toHaveBeenCalledWith("画像の圧縮に失敗しました。別の画像で試してください。", "error");
    expect(result.current.imageUploading).toBe(false);

    spy.mockRestore();
  });
});
