import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', 'playwright'],
};

export default nextConfig;
