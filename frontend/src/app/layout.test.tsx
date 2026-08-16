import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

import RootLayout, { viewport } from "./layout";

describe("viewport", () => {
  it("should match the expected viewport configuration", () => {
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
