import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVisitCrud, UseVisitCrudOptions } from "./useVisitCrud";
import { VisitFormState } from "../types";
import { getDefaultForm } from "../utils";

describe("useVisitCrud", () => {
  let mockForm: VisitFormState;
  let mockFormRef: { current: VisitFormState };
  let defaultOptions: UseVisitCrudOptions;

  beforeEach(() => {
    mockForm = getDefaultForm();
    mockFormRef = { current: mockForm };
    defaultOptions = {
      editingId: null,
      selectedLocation: { lat: 34.95, lng: 138.4 },
      historyEntries: [],
      formRef: mockFormRef,
      setForm: vi.fn(),
      addVisit: vi.fn().mockResolvedValue({ success: true }),
      editVisit: vi.fn().mockResolvedValue({ success: true }),
      deleteVisit: vi.fn().mockResolvedValue({ success: true }),
      removeHistoryEntry: vi.fn(),
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      showToast: vi.fn(),
      cancelEditing: vi.fn(),
    };
  });

  it("handleSubmit で新規登録成功時に addVisit と cancelEdit が呼ばれること", async () => {
    mockForm.name = "サウナ北欧";
    const { result } = renderHook(() => useVisitCrud(defaultOptions));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(defaultOptions.addVisit).toHaveBeenCalledWith(
      { lat: 34.95, lng: 138.4 },
      expect.objectContaining({ name: "サウナ北欧" }),
    );
    expect(defaultOptions.cancelEditing).toHaveBeenCalledWith(true);
  });

  it("handleSubmit の onCompleted が保存成功時のみ呼ばれること（モバイルのシート位置を戻すため）", async () => {
    const { result, rerender } = renderHook(() => useVisitCrud(defaultOptions));
    const onCompleted = vi.fn();
    const submit = async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e, onCompleted);
    };

    // 名前が未入力のうちはバリデーションで止まるため呼ばれない
    await act(submit);
    expect(onCompleted).not.toHaveBeenCalled();

    // 名前を入力した状態にして再度テスト
    mockForm.name = "サウナ北欧";
    rerender();
    await act(submit);

    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it("handleSubmit で保存に失敗したときは onCompleted を呼ばないこと", async () => {
    const options = {
      ...defaultOptions,
      addVisit: vi.fn().mockResolvedValue({ success: false }),
    };
    mockForm.name = "サウナ北欧";
    const { result } = renderHook(() => useVisitCrud(options));
    const onCompleted = vi.fn();

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e, onCompleted);
    });

    expect(onCompleted).not.toHaveBeenCalled();
    expect(options.cancelEditing).not.toHaveBeenCalled();
  });

  it("confirmDelete で削除成功時に deleteVisit, showToast, closeDeleteConfirm が呼ばれること", async () => {
    const options = { ...defaultOptions, editingId: "v1" };
    const { result } = renderHook(() => useVisitCrud(options));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(options.deleteVisit).toHaveBeenCalledWith("v1");
    expect(options.showToast).toHaveBeenCalledWith("記録を削除しました。", "success");
    expect(options.closeDeleteConfirm).toHaveBeenCalled();
  });

  it("handleSubmit でサウナ名未入力時にバリデーションエラーのトーストが表示され登録がキャンセルされること", async () => {
    const { result } = renderHook(() => useVisitCrud(defaultOptions));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(defaultOptions.showToast).toHaveBeenCalledWith("サウナ名を入力してください。", "error");
    expect(defaultOptions.addVisit).not.toHaveBeenCalled();
  });

  it("handleSubmit で場所未選択時にエラーのトーストが表示されること", async () => {
    const options = { ...defaultOptions, selectedLocation: null };
    mockForm.name = "サウナ北欧";
    const { result } = renderHook(() => useVisitCrud(options));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(options.showToast).toHaveBeenCalledWith("サウナの場所が選択されていません。", "error");
    expect(options.addVisit).not.toHaveBeenCalled();
  });
});
