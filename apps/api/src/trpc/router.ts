import { router, publicProcedure } from './index';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
