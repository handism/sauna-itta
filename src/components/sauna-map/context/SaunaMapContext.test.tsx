import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReactNode } from "react";
import {
  SaunaMapProvider,
  useSaunaUI,
  useSaunaUIState,
  useSaunaUIActions,
  useVisitsCRUD,
  useVisitFiltersContext,
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

  it("useVisitsCRUD が VisitsCRUDProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useVisitsCRUD(), { wrapper });

    expect(result.current.visits).toBeDefined();
    expect(Array.isArray(result.current.visits)).toBe(true);
    expect(result.current.importing).toBe(false);
  });

  it("useVisitFiltersContext が VisitFiltersProvider 内で正常に動作すること", () => {
    const { result } = renderHook(() => useVisitFiltersContext(), { wrapper });

    expect(Array.isArray(result.current.filteredVisits)).toBe(true);
    expect(result.current.isFilterActive).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it("フィルター変更で CRUD 側の Context 値が作り直されないこと", () => {
    const { result } = renderHook(
      () => ({ crud: useVisitsCRUD(), filters: useVisitFiltersContext() }),
      { wrapper },
    );

    const crudBefore = result.current.crud;

    act(() => {
      result.current.filters.setFilters((prev) => ({ ...prev, search: "サウナ" }));
    });

    expect(result.current.filters.isFilterActive).toBe(true);
    // CRUD 側は同一参照のままであること（束ねるフックを復活させると壊れる）
    expect(result.current.crud).toBe(crudBefore);
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

  it("handleEditVisit が選択状態と編集モードをまとめて開始すること", () => {
    const { result } = renderHook(
      () => ({
        mapState: useSaunaMapState(),
        editor: useSaunaEditor(),
        crud: useVisitsCRUD(),
      }),
      { wrapper },
    );

    const target = result.current.crud.visits[0];
    expect(target).toBeDefined();

    act(() => {
      result.current.mapState.handleEditVisit(target);
    });

    expect(result.current.mapState.selectedId).toBe(target.id);
    expect(result.current.editor.mode).toBe("editing");
    expect(result.current.editor.editingId).toBe(target.id);

    act(() => {
      result.current.mapState.handleCancelEditing();
    });

    expect(result.current.editor.mode).toBe("list");
    expect(result.current.editor.editingId).toBeNull();
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
