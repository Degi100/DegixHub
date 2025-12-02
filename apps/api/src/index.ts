import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/index';
import authRoutes from './routes/auth';
import { initDatabase } from './db/init';

const app = new Hono();

// Simple request logger
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  // Skip health checks and static assets
  const path = c.req.path;
  if (path === '/' || path.includes('.')) return;

  // Format tRPC calls nicely
  if (path.startsWith('/trpc/')) {
    const procedure = path.replace('/trpc/', '');
    const icon = c.req.method === 'GET' ? '📥' : '📤';
    console.log(`${icon} ${procedure} (${ms}ms)`);
  } else {
    console.log(`${c.req.method} ${path} (${ms}ms)`);
  }
});

// Initialize database on startup
await initDatabase().catch(console.error);

// CORS middleware
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
  })
);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'DegixHub API',
    version: '0.1.0',
    status: 'running',
    port: process.env.PORT || 3003,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (Hono native for cookie handling)
app.route('/auth', authRoutes);

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

const port = process.env.PORT || 3003;

console.log(`🚀 DegixHub API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
