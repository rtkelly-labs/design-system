import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  experimental: { optimizePackageImports: ['@rtkelly13/design-system'] },
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default config;
