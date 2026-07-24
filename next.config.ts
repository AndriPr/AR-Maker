import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    // Bypasses TypeScript errors during Vercel builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
