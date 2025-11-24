import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';

const app = new Hono();

// CORS middleware
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'DegixHub API',
    version: '0.1.0',
    status: 'running',
  });
});

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  })
);

const port = process.env.PORT || 3001;

console.log(`🚀 DegixHub API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
