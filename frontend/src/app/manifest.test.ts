import { describe, expect, it } from "vitest";
import manifest, { dynamic } from "./manifest";

describe("manifest (local モード)", () => {
  it("force-static が指定されていること", () => {
    expect(dynamic).toBe("force-static");
  });

  it("local モード用のマニフェスト設定を生成すること", () => {
    const result = manifest();

    expect(result).toEqual({
      name: "サウナイッタ - マイととのいマップ",
      short_name: "サウナイッタ",
      description: "サウナ訪問記録や行きたいサウナをマップに記録・可視化できるアプリ",
      start_url: "/sauna-itta/",
      scope: "/sauna-itta/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      orientation: "portrait",
      icons: [
        {
          src: "/sauna-itta/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/sauna-itta/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/sauna-itta/icons/icon-maskable-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/sauna-itta/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    });
  });
});
