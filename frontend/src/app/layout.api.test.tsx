import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

vi.mock("../../dataSource", () => ({
  DATA_SOURCE: "api",
}));

import { metadata } from "./layout";

describe("layout (api モード)", () => {
  describe("metadata", () => {
    it("api モード用のアイコンパス（basePath なし）が設定されていること", () => {
      type IconsType = {
        icon?: { url: string; sizes?: string; type?: string }[];
        apple?: { url: string; sizes?: string; type?: string }[];
      };
      const icons = metadata.icons as IconsType;

      expect(icons.icon).toEqual([
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ]);
      expect(icons.apple).toEqual([
        { url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" },
      ]);
    });
  });
});
