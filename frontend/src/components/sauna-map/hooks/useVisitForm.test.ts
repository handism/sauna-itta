import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVisitForm, UseVisitFormOptions } from "./useVisitForm";
import { SaunaVisit } from "../types";

describe("useVisitForm", () => {
  const mockVisit: SaunaVisit = {
    id: "v1",
    name: "サウナしきじ",
    lat: 34.95,
    lng: 138.4,
    date: "2023-05-01",
    comment: "最高",
    rating: 5,
  };

  let defaultOptions: UseVisitFormOptions;

  beforeEach(() => {
    defaultOptions = {
      editingId: null,
      selectedLocation: { lat: 34.95, lng: 138.4 },
      historyEntries: [],
      addVisit: vi.fn().mockReturnValue({ success: true }),
      editVisit: vi.fn().mockReturnValue({ success: true }),
      deleteVisit: vi.fn().mockReturnValue({ success: true }),
      removeHistoryEntry: vi.fn(),
      startCreate: vi.fn(),
      startEdit: vi.fn(),
      cancelEdit: vi.fn(),
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it("初期状態でデフォルトのフォーム状態を保持していること", () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));

    expect(result.current.form.name).toBe("");
    expect(result.current.imageUploading).toBe(false);
  });

  it("startNewVisit を呼ぶと startCreate が呼び出されフォームがリセットされること", () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));

    act(() => {
      result.current.startNewVisit();
    });

    expect(defaultOptions.startCreate).toHaveBeenCalled();
    expect(result.current.form.name).toBe("");
  });

  it("startEditing を呼ぶと startEdit が呼び出され指定データがフォームに反映されること", () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));

    act(() => {
      result.current.startEditing(mockVisit);
    });

    expect(defaultOptions.startEdit).toHaveBeenCalledWith(mockVisit);
    expect(result.current.form.name).toBe("サウナしきじ");
  });

  it("handleSubmit で新規登録成功時に addVisit と cancelEdit が呼ばれること", async () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, name: "サウナ北欧" }));
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(defaultOptions.addVisit).toHaveBeenCalledWith(
      { lat: 34.95, lng: 138.4 },
      expect.objectContaining({ name: "サウナ北欧" }),
    );
    expect(defaultOptions.cancelEdit).toHaveBeenCalledWith(true);
  });

  it("handleSubmit の onCompleted が保存成功時のみ呼ばれること（モバイルのシート位置を戻すため）", async () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));
    const onCompleted = vi.fn();
    const submit = async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e, onCompleted);
    };

    // 名前が未入力のうちはバリデーションで止まるため呼ばれない
    await act(submit);
    expect(onCompleted).not.toHaveBeenCalled();

    act(() => {
      result.current.setForm((prev) => ({ ...prev, name: "サウナ北欧" }));
    });
    await act(submit);

    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it("handleSubmit で保存に失敗したときは onCompleted を呼ばないこと", () => {
    const options = {
      ...defaultOptions,
      addVisit: vi.fn().mockReturnValue({ success: false }),
    };
    const { result } = renderHook(() => useVisitForm(options));
    const onCompleted = vi.fn();

    act(() => {
      result.current.setForm((prev) => ({ ...prev, name: "サウナ北欧" }));
    });
    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e, onCompleted);
    });

    expect(onCompleted).not.toHaveBeenCalled();
    expect(options.cancelEdit).not.toHaveBeenCalled();
  });

  it("confirmDelete で削除成功時に deleteVisit, showToast, closeDeleteConfirm が呼ばれること", async () => {
    const options = { ...defaultOptions, editingId: "v1" };
    const { result } = renderHook(() => useVisitForm(options));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(options.deleteVisit).toHaveBeenCalledWith("v1");
    expect(options.showToast).toHaveBeenCalledWith("記録を削除しました。", "success");
    expect(options.closeDeleteConfirm).toHaveBeenCalled();
  });

  it("handleSubmit でサウナ名未入力時にバリデーションエラーのトーストが表示され登録がキャンセルされること", () => {
    const { result } = renderHook(() => useVisitForm(defaultOptions));

    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });

    expect(defaultOptions.showToast).toHaveBeenCalledWith("サウナ名を入力してください。", "error");
    expect(defaultOptions.addVisit).not.toHaveBeenCalled();
  });

  it("handleSubmit で場所未選択時にエラーのトーストが表示されること", () => {
    const options = { ...defaultOptions, selectedLocation: null };
    const { result } = renderHook(() => useVisitForm(options));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, name: "サウナ北欧" }));
    });

    act(() => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleSubmit(e);
    });

    expect(options.showToast).toHaveBeenCalledWith("サウナの場所が選択されていません。", "error");
    expect(options.addVisit).not.toHaveBeenCalled();
  });
});
