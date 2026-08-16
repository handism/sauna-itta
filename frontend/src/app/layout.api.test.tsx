import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

// Mock DATA_SOURCE as api
vi.mock("../../dataSource", () => ({
  DATA_SOURCE: "api"
}));

import { metadata } from "./layout";

describe("metadata (API mode)", () => {
  it("contains correct icon paths without base path", () => {
    expect(metadata.icons).toBeDefined();

    // With DATA_SOURCE=api, publicBasePath is ""
    const icons = metadata.icons as any;
    expect(icons.icon[0].url).toBe("/icon.svg");
    expect(icons.icon[1].url).toBe("/icons/icon-192.png");
    expect(icons.apple[0].url).toBe("/icons/apple-icon.png");
  });
});
