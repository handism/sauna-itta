import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReactNode } from "react";
import {
  SaunaMapProvider,
  useSaunaMap,
  useSaunaUI,
  useSaunaUIState,
  useSaunaUIActions,
  useSaunaVisitsData,
  useSaunaEditor,
  useSaunaEditorState,
  useSaunaEditorActions,
  useSaunaMapState,
} from "./SaunaMapContext";

// Setup matchMedia and localStorage mocks
beforeEach(() => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key in store) {
        delete store[key];
      }
    }),
  };

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SaunaMapProvider>{children}</SaunaMapProvider>
);

describe("SaunaMap Contexts", () => {
  it("useSaunaUI が UIProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useSaunaUI(), { wrapper });

    expect(result.current.theme).toBeDefined();
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isShareViewOpen).toBe(false);

    act(() => {
      result.current.openShareView();
    });

    expect(result.current.isShareViewOpen).toBe(true);
  });

  it("useSaunaVisitsData が VisitsDataProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useSaunaVisitsData(), { wrapper });

    expect(result.current.visits).toBeDefined();
    expect(Array.isArray(result.current.visits)).toBe(true);
    expect(result.current.isFilterActive).toBe(false);
  });

  it("useSaunaEditor が EditorProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useSaunaEditor(), { wrapper });

    expect(result.current.mode).toBe("list");
    expect(result.current.isAdding).toBe(false);

    act(() => {
      result.current.startNewVisit();
    });

    expect(result.current.mode).toBe("creating:pick");
    expect(result.current.isAdding).toBe(true);
  });

  it("useSaunaMapState が MapStateProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useSaunaMapState(), { wrapper });

    expect(result.current.hoveredId).toBeNull();
    expect(result.current.enableClustering).toBe(true);

    act(() => {
      result.current.setHoveredId("test-id");
    });

    expect(result.current.hoveredId).toBe("test-id");
  });

  it("後方互換用 useSaunaMap が全状態を結合して正常に機能すること", () => {
    const { result } = renderHook(() => useSaunaMap(), { wrapper });

    expect(result.current.theme).toBeDefined();
    expect(result.current.visits).toBeDefined();
    expect(result.current.mode).toBe("list");
    expect(result.current.hoveredId).toBeNull();

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBeDefined();
  });

  it("分離された UIState と UIActions フックがそれぞれ正常に動作すること", () => {
    const { result } = renderHook(
      () => ({
        state: useSaunaUIState(),
        actions: useSaunaUIActions(),
      }),
      { wrapper },
    );

    expect(result.current.state.isShareViewOpen).toBe(false);

    act(() => {
      result.current.actions.openShareView();
    });

    expect(result.current.state.isShareViewOpen).toBe(true);
  });

  it("分離された EditorState と EditorActions フックがそれぞれ正常に動作すること", () => {
    const { result } = renderHook(
      () => ({
        state: useSaunaEditorState(),
        actions: useSaunaEditorActions(),
      }),
      { wrapper },
    );

    expect(result.current.state.mode).toBe("list");

    act(() => {
      result.current.actions.startNewVisit();
    });

    expect(result.current.state.mode).toBe("creating:pick");
  });
});
