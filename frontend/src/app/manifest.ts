import type { MetadataRoute } from "next";
import { DATA_SOURCE } from "../../dataSource";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = DATA_SOURCE === "api" ? "" : "/sauna-itta";
  return {
    name: "サウナイッタ - マイととのいマップ",
    short_name: "サウナイッタ",
    description: "サウナ訪問記録や行きたいサウナをマップに記録・可視化できるアプリ",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: `${basePath}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-maskable-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${basePath}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
