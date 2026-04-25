import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', '@react-pdf/renderer', '@anthropic-ai/sdk'],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // pdfjs-dist v5 ships .mjs files; webpack needs this rule to parse them
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
