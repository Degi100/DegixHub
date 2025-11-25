import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/index';
import authRoutes from './routes/auth';

const app = new Hono();

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
