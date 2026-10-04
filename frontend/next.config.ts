import type { NextConfig } from "next";
import { BASE_PATH, DATA_SOURCE } from "./dataSource";

const isLocalMode = DATA_SOURCE === "local";
const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(!isDevelopment && { output: "export" as const }),
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH ? `${BASE_PATH}/` : "",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  // localモードのデモ記録（同梱JSON、約240KB）は apiモードでは一度も読まないが、
  // utils/savedVisits.ts の静的 import から両モードのバンドルへ入ってしまう。
  // Repository の切り替えは実行時の分岐のため、バンドラは import を外せない。
  // apiモードだけ空配列へ差し替え、配信物から除く。
  ...(!isLocalMode && {
    turbopack: {
      resolveAlias: {
        "@/data/sauna-visits.json": "./src/data/sauna-visits.api.json",
      },
    },
  }),
  ...(!isLocalMode && isDevelopment && {
    async rewrites() {
      const backend = process.env.API_PROXY_TARGET ?? "http://localhost:3001";
      return [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
        { source: "/auth/:path*", destination: `${backend}/auth/:path*` },
        { source: "/dev/:path*", destination: `${backend}/dev/:path*` },
      ];
    },
  }),
};

export default nextConfig;
