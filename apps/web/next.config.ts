import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
