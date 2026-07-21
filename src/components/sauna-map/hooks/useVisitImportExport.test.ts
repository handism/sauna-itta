import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisitImportExport } from "./useVisitImportExport";
import { SaunaVisit } from "../types";

describe("useVisitImportExport", () => {
  it("should throw error for invalid JSON", async () => {
    const visits: SaunaVisit[] = [];
    const saveVisits = vi.fn();
    const { result } = renderHook(() => useVisitImportExport(visits, saveVisits));

    const file = new File(["invalid json"], "test.json", { type: "application/json" });

    await expect(result.current.importVisitsFromFile(file)).rejects.toThrow("Invalid JSON file");
  });
});
