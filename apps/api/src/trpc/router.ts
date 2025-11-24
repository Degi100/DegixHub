import { router, publicProcedure } from './index';
import { authRouter } from './routers/auth';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
