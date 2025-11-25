import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hub/shared'],
  typedRoutes: true,
  // Enable standalone only in production/Linux environments
  output: process.platform === 'win32' ? undefined : 'standalone',

  // Proxy API requests through Next.js server
  async rewrites() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: 'http://localhost:3003/trpc/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3003/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
