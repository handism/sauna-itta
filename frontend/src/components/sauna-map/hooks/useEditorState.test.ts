import { renderHook, act, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { useEditorState } from "./useEditorState";
import { SaunaVisit, LatLng } from "../types";

describe("useEditorState", () => {
  afterEach(() => {
    cleanup();
  });

  const mockVisit: SaunaVisit = {
    id: "test-id",
    name: "Test Sauna",
    lat: 35.6895,
    lng: 139.6917,
    comment: "Test comment",
    date: "2023-01-01",
    status: "visited",
  };

  const mockLocation: LatLng = { lat: 35.0, lng: 139.0 };

  describe("Initial State", () => {
    it("should initialize with correct state for desktop (isMobile: false)", () => {
      const { result } = renderHook(() => useEditorState(false));
      expect(result.current.state).toEqual({
        mode: "list",
        editingId: null,
        selectedLocation: null,
        isSidebarExpanded: true,
        mapTarget: null,
      });
    });

    it("should initialize with correct state for mobile (isMobile: true)", () => {
      const { result } = renderHook(() => useEditorState(true));
      expect(result.current.state).toEqual({
        mode: "list",
        editingId: null,
        selectedLocation: null,
        isSidebarExpanded: false,
        mapTarget: null,
      });
    });
  });

  describe("startCreate", () => {
    it("should handle startCreate on desktop", () => {
      const { result } = renderHook(() => useEditorState(false));

      act(() => {
        result.current.startCreate();
      });

      expect(result.current.state.mode).toBe("creating:pick");
      expect(result.current.state.isSidebarExpanded).toBe(true); // Should keep state
    });

    it("should handle startCreate on mobile", () => {
      const { result } = renderHook(() => useEditorState(true));

      // Ensure sidebar is expanded to test it gets collapsed
      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.state.isSidebarExpanded).toBe(true);

      act(() => {
        result.current.startCreate();
      });

      expect(result.current.state.mode).toBe("creating:pick");
      expect(result.current.state.isSidebarExpanded).toBe(false); // Collapsed on mobile
    });
  });

  describe("startEdit", () => {
    it("should handle startEdit", () => {
      const { result } = renderHook(() => useEditorState(false));

      act(() => {
        result.current.startEdit(mockVisit);
      });

      expect(result.current.state).toEqual({
        mode: "editing",
        editingId: mockVisit.id,
        selectedLocation: { lat: mockVisit.lat, lng: mockVisit.lng },
        isSidebarExpanded: true,
        mapTarget: { lat: mockVisit.lat, lng: mockVisit.lng },
      });
    });
  });

  describe("selectLocation", () => {
    it("should change mode to creating:form if in creating:pick mode", () => {
      const { result } = renderHook(() => useEditorState(false));

      act(() => {
        result.current.startCreate(); // enters creating:pick
      });

      expect(result.current.state.mode).toBe("creating:pick");

      act(() => {
        result.current.selectLocation(mockLocation);
      });

      expect(result.current.state.mode).toBe("creating:form");
      expect(result.current.state.selectedLocation).toEqual(mockLocation);
    });

    it("should keep mode if not in creating:pick mode", () => {
      const { result } = renderHook(() => useEditorState(false)); // mode: list

      act(() => {
        result.current.selectLocation(mockLocation);
      });

      expect(result.current.state.mode).toBe("list");
      expect(result.current.state.selectedLocation).toEqual(mockLocation);
    });

    it("should expand sidebar on mobile when selecting location", () => {
      const { result } = renderHook(() => useEditorState(true)); // mode: list, sidebar: false

      act(() => {
        result.current.selectLocation(mockLocation);
      });

      expect(result.current.state.isSidebarExpanded).toBe(true);
    });
  });

  describe("cancelEdit", () => {
    it("should handle cancelEdit on desktop", () => {
      const { result } = renderHook(() => useEditorState(false));

      act(() => {
        result.current.startEdit(mockVisit);
      });
      expect(result.current.state.mode).toBe("editing");

      act(() => {
        result.current.cancelEdit();
      });

      expect(result.current.state.mode).toBe("list");
      expect(result.current.state.editingId).toBeNull();
      expect(result.current.state.selectedLocation).toBeNull();
      expect(result.current.state.isSidebarExpanded).toBe(true); // Kept on desktop
    });

    it("should handle cancelEdit on mobile when not completed", () => {
      const { result } = renderHook(() => useEditorState(true));

      act(() => {
        result.current.startEdit(mockVisit);
      });
      expect(result.current.state.isSidebarExpanded).toBe(true);

      act(() => {
        result.current.cancelEdit(); // default completed = false
      });

      expect(result.current.state.isSidebarExpanded).toBe(false);
    });

    it("should handle cancelEdit on mobile when completed", () => {
      const { result } = renderHook(() => useEditorState(true));

      act(() => {
        result.current.startEdit(mockVisit);
      });
      expect(result.current.state.isSidebarExpanded).toBe(true);

      act(() => {
        result.current.cancelEdit(true); // completed = true
      });

      expect(result.current.state.isSidebarExpanded).toBe(true);
    });
  });

  describe("toggleSidebar", () => {
    it("should toggle isSidebarExpanded", () => {
      const { result } = renderHook(() => useEditorState(false));
      expect(result.current.state.isSidebarExpanded).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.isSidebarExpanded).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.isSidebarExpanded).toBe(true);
    });
  });

});
