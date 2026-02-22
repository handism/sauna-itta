import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sauna-itta",
  assetPrefix: "/sauna-itta/",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
