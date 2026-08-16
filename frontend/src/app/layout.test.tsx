import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

import RootLayout, { metadata, viewport } from "./layout";

describe("layout", () => {
  describe("metadata (local モード)", () => {
    it("基本的なタイトルと説明が設定されていること", () => {
      expect(metadata.title).toBe("サウナイッタ");
      expect(metadata.description).toBe("マイととのいマップ - サウナ訪問記録・マップ可視化アプリ");
    });

    it("appleWebApp のメタデータが正しく設定されていること", () => {
      expect(metadata.appleWebApp).toEqual({
        capable: true,
        statusBarStyle: "black-translucent",
        title: "サウナイッタ",
      });
    });

    it("local モード用のアイコンパス（/sauna-itta プレフィックス付き）が設定されていること", () => {
      type IconsType = {
        icon?: { url: string; sizes?: string; type?: string }[];
        apple?: { url: string; sizes?: string; type?: string }[];
      };
      const icons = metadata.icons as IconsType;

      expect(icons.icon).toEqual([
        { url: "/sauna-itta/icon.svg", type: "image/svg+xml" },
        { url: "/sauna-itta/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ]);
      expect(icons.apple).toEqual([
        { url: "/sauna-itta/icons/apple-icon.png", sizes: "180x180", type: "image/png" },
      ]);
    });
  });

  describe("viewport", () => {
    it("期待通りの viewport 設定を持つこと", () => {
      expect(viewport).toEqual({
        width: "device-width",
        initialScale: 1,
        maximumScale: 5,
        viewportFit: "cover",
        themeColor: [
          { media: "(prefers-color-scheme: light)", color: "#f2f6fc" },
          { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
        ],
      });
    });
  });

  describe("RootLayout", () => {
    it("初期テーマクラスによる hydration 差分を許容すること", () => {
      const layout = RootLayout({ children: <main /> });

      expect(layout).toMatchObject({
        type: "html",
        props: {
          lang: "ja",
          suppressHydrationWarning: true,
        },
      });
    });
  });
});

