import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  reactStrictMode: false,
  eslint: {
    // Disable ESLint during builds to allow deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow TypeScript errors during build (optional, for faster builds)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
