import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useUIState } from "./useUIState";

describe("useUIState", () => {
  it("should initialize with all modals closed", () => {
    const { result } = renderHook(() => useUIState());
    expect(result.current.activeModal).toBeNull();
    expect(result.current.isShareViewOpen).toBe(false);
    expect(result.current.isFilterModalOpen).toBe(false);
    expect(result.current.isDeleteConfirmOpen).toBe(false);
    expect(result.current.isMobileMenuOpen).toBe(false);
  });

  it("should toggle and control filter panel", () => {
    const { result } = renderHook(() => useUIState());

    expect(result.current.isFilterPanelOpen).toBe(false);

    act(() => {
      result.current.toggleFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(true);

    act(() => {
      result.current.closeFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(false);
  });

  it("should close modal via closeModal", () => {
    const { result } = renderHook(() => useUIState());

    act(() => {
      result.current.openDeleteConfirm();
    });

    expect(result.current.isDeleteConfirmOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
    expect(result.current.isDeleteConfirmOpen).toBe(false);
  });

  it("should toggle mobile menu", () => {
    const { result } = renderHook(() => useUIState());

    expect(result.current.isMobileMenuOpen).toBe(false);

    act(() => {
      result.current.toggleMobileMenu();
    });

    expect(result.current.isMobileMenuOpen).toBe(true);

    act(() => {
      result.current.closeMobileMenu();
    });

    expect(result.current.isMobileMenuOpen).toBe(false);
  });
});
