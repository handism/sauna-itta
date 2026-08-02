import type { NextConfig } from "next";
import { DATA_SOURCE } from "./dataSource";

const isLocalMode = DATA_SOURCE === "local";
const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(!isDevelopment && { output: "export" as const }),
  basePath: isLocalMode ? "/sauna-itta" : "",
  assetPrefix: isLocalMode ? "/sauna-itta/" : "",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
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
