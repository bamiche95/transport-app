import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['lightningcss'],
  turbopack: {
    root: '.',
  },
  /* config options here */
};

export default nextConfig;
