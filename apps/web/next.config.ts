import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hub/shared'],
  typedRoutes: true,
  output: 'standalone',
};

export default nextConfig;
