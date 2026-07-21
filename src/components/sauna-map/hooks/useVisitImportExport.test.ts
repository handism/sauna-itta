import { renderHook, act } from "@testing-library/react";
import { expect, test, vi, describe, beforeEach, type MockedFunction } from "vitest";
import { useVisitImportExport } from "./useVisitImportExport";
import { SaunaVisit } from "../types";

describe("useVisitImportExport", () => {
  const mockVisits: SaunaVisit[] = [
    { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" },
  ];
  let saveVisitsMock: MockedFunction<(visits: SaunaVisit[]) => boolean>;

  beforeEach(() => {
    saveVisitsMock = vi.fn<(visits: SaunaVisit[]) => boolean>().mockReturnValue(true);
  });

  test("importVisitsFromFile handles invalid JSON", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const file = new File(["invalid json"], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow("Invalid JSON file");
  });

  test("importVisitsFromFile handles invalid schema", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const file = new File(['[{"invalid": "schema"}]'], "test.json", { type: "application/json" });
    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow(/Imported data is not in the correct format/);
  });

  test("importVisitsFromFile imports new valid visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const newVisit = { id: "2", name: "Sauna B", lat: 35.1, lng: 139.1, comment: "nice", date: "2023-01-02" };
    const file = new File([JSON.stringify([newVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 1, success: true });
    expect(saveVisitsMock).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "2" }),
      expect.objectContaining({ id: "1" }),
    ]));
  });

  test("importVisitsFromFile ignores duplicate visits", async () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const duplicateVisit = { id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2023-01-01" };
    const file = new File([JSON.stringify([duplicateVisit])], "test.json", { type: "application/json" });
    const res = await result.current.importVisitsFromFile(file);
    expect(res).toEqual({ added: 0, success: true });
    expect(saveVisitsMock).not.toHaveBeenCalled();
  });

  test("exportVisits creates a download link", () => {
    const { result } = renderHook(() => useVisitImportExport(mockVisits, saveVisitsMock));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, "setAttribute");

    act(() => {
      result.current.exportVisits();
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith("download", "sauna-visits.json");
    expect(setAttributeSpy).toHaveBeenCalledWith("href", expect.stringContaining("data:application/json;charset=utf-8,"));

    clickSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });
});
