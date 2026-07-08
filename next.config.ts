import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    // 型検証は `npm run typecheck` で実行する。
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
