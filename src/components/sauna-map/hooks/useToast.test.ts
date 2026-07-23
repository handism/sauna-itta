import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initial state be null", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it("should set toast on showToast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("テストメッセージ", "success");
    });

    expect(result.current.toast).not.toBeNull();
    expect(result.current.toast?.message).toBe("テストメッセージ");
    expect(result.current.toast?.tone).toBe("success");
  });

  it("should auto clear info/success toast after 3 seconds", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("保存しました", "success");
    });

    expect(result.current.toast?.message).toBe("保存しました");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toast).toBeNull();
  });

  it("should not auto clear error toast after 3 seconds", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("エラーが発生しました", "error");
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toast).not.toBeNull();
    expect(result.current.toast?.message).toBe("エラーが発生しました");
  });

  it("should clear toast on clearToast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("メッセージ", "info");
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.clearToast();
    });

    expect(result.current.toast).toBeNull();
  });
});
