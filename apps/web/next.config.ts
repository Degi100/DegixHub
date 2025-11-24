import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hub/shared'],
  typedRoutes: true,
};

export default nextConfig;
