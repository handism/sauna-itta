import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
}));

import RootLayout from "./layout";

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
