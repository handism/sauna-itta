import { describe, expect, it, vi } from "vitest";

vi.mock("../../dataSource", () => ({
  DATA_SOURCE: "api",
}));

import manifest from "./manifest";

describe("manifest (api モード)", () => {
  it("api モード用のマニフェスト設定（basePath なし）を生成すること", () => {
    const result = manifest();

    expect(result).toEqual({
      name: "サウナイッタ - マイととのいマップ",
      short_name: "サウナイッタ",
      description: "サウナ訪問記録や行きたいサウナをマップに記録・可視化できるアプリ",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      orientation: "portrait",
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-maskable-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    });
  });
});
