import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
