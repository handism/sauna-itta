import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSaunaVisits } from "./useSaunaVisits";
import * as utils from "../utils";
import * as useVisitCRUD from "./useVisitCRUD";
import * as useVisitImportExport from "./useVisitImportExport";
import { SaunaVisit } from "../types";

// Mock dependencies
vi.mock("../utils", async () => {
  const actual = await vi.importActual("../utils");
  return {
    ...actual,
    getInitialVisits: vi.fn(),
    VISITS_STORAGE_KEY: "sauna-itta_visits",
  };
});

vi.mock("./useVisitCRUD", () => ({
  useVisitCRUD: vi.fn(),
}));

vi.mock("./useVisitImportExport", () => ({
  useVisitImportExport: vi.fn(),
}));

describe("useSaunaVisits", () => {
  const mockInitialVisits: SaunaVisit[] = [
    { id: "1", name: "Sauna A", lat: 0, lng: 0, comment: "", date: "2023-01-01" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup localStorage mock
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

    // Mock console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Default mock returns
    vi.mocked(utils.getInitialVisits).mockReturnValue(mockInitialVisits);
    vi.mocked(useVisitCRUD.useVisitCRUD).mockReturnValue({
      addVisit: vi.fn(),
      editVisit: vi.fn(),
      deleteVisit: vi.fn(),
      removeLastHistoryEntry: vi.fn(),
    });
    vi.mocked(useVisitImportExport.useVisitImportExport).mockReturnValue({
      importVisitsFromFile: vi.fn(),
      exportVisits: vi.fn(),
    });
  });

  it("should initialize with initial visits and return child hook methods", () => {
    const mockCRUDMethods = {
      addVisit: vi.fn(),
      editVisit: vi.fn(),
      deleteVisit: vi.fn(),
      removeLastHistoryEntry: vi.fn(),
    };
    const mockImportExportMethods = {
      importVisitsFromFile: vi.fn(),
      exportVisits: vi.fn(),
    };

    vi.mocked(useVisitCRUD.useVisitCRUD).mockReturnValue(mockCRUDMethods);
    vi.mocked(useVisitImportExport.useVisitImportExport).mockReturnValue(mockImportExportMethods);

    const { result } = renderHook(() => useSaunaVisits());

    // Verify initial state
    expect(result.current.visits).toEqual(mockInitialVisits);

    // Verify child hooks were called correctly
    expect(useVisitCRUD.useVisitCRUD).toHaveBeenCalledWith(mockInitialVisits, expect.any(Function));
    expect(useVisitImportExport.useVisitImportExport).toHaveBeenCalledWith(mockInitialVisits, expect.any(Function));

    // Verify all methods are exposed
    expect(result.current.addVisit).toBe(mockCRUDMethods.addVisit);
    expect(result.current.importVisitsFromFile).toBe(mockImportExportMethods.importVisitsFromFile);
  });

  it("should update state and save to localStorage on successful save", () => {
    const { result } = renderHook(() => useSaunaVisits());

    // Extract the saveVisits callback that was passed to a child hook
    const saveVisits = vi.mocked(useVisitCRUD.useVisitCRUD).mock.calls[0][1];

    const newVisits: SaunaVisit[] = [
      { id: "1", name: "Sauna A", lat: 0, lng: 0, comment: "", date: "2023-01-01" },
      { id: "2", name: "Sauna B", lat: 0, lng: 0, comment: "", date: "2023-01-02" },
    ];

    let success;
    act(() => {
      success = saveVisits(newVisits);
    });

    expect(success).toBe(true);
    expect(result.current.visits).toEqual(newVisits);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      utils.VISITS_STORAGE_KEY,
      JSON.stringify(newVisits)
    );
  });

  it("should return false and log error if localStorage throws", () => {
    // Make localStorage.setItem throw an error
    window.localStorage.setItem = vi.fn(() => {
      throw new Error("Quota exceeded");
    });

    const { result } = renderHook(() => useSaunaVisits());

    // Extract the saveVisits callback
    const saveVisits = vi.mocked(useVisitCRUD.useVisitCRUD).mock.calls[0][1];

    const newVisits: SaunaVisit[] = [
      { id: "1", name: "Sauna A", lat: 0, lng: 0, comment: "", date: "2023-01-01" },
    ];

    let success;
    act(() => {
      success = saveVisits(newVisits);
    });

    expect(success).toBe(false);
    // State is still updated even if persistence fails
    expect(result.current.visits).toEqual(newVisits);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to persist visits to localStorage:",
      expect.any(Error)
    );
  });
});
