import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hub/shared'],
  typedRoutes: true,
  // Enable standalone only in production/Linux environments
  output: process.platform === 'win32' ? undefined : 'standalone',
  // Note: API proxying is now handled by API Routes in app/api/
};

export default nextConfig;
