import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

// We need to mock DATA_SOURCE and its dependency because they are evaluated at import time
vi.mock("../../dataSource", () => ({
  DATA_SOURCE: "local"
}));

import RootLayout, { metadata, viewport } from "./layout";

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

describe("metadata", () => {
  it("contains correct basic metadata", () => {
    expect(metadata.title).toBe("サウナイッタ");
    expect(metadata.description).toBe("マイととのいマップ - サウナ訪問記録・マップ可視化アプリ");
  });

  it("contains apple web app metadata", () => {
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      statusBarStyle: "black-translucent",
      title: "サウナイッタ",
    });
  });

  it("contains correct icon paths", () => {
    expect(metadata.icons).toBeDefined();
    // Verify the structure without exact URLs first
    expect(metadata.icons?.icon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "image/svg+xml" }),
        expect.objectContaining({ sizes: "192x192", type: "image/png" })
      ])
    );

    // With DATA_SOURCE=local, publicBasePath is /sauna-itta
    const icons = metadata.icons as any;
    expect(icons.icon[0].url).toBe("/sauna-itta/icon.svg");
    expect(icons.icon[1].url).toBe("/sauna-itta/icons/icon-192.png");
    expect(icons.apple[0].url).toBe("/sauna-itta/icons/apple-icon.png");
  });
});

describe("viewport", () => {
  it("contains correct viewport settings", () => {
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
