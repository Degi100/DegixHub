import { router, publicProcedure } from './index';
import { authRouter } from './routers/auth';
import { linksRouter } from './routers/links';
import { credentialsRouter } from './routers/credentials';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
  auth: authRouter,
  links: linksRouter,
  credentials: credentialsRouter,
});

export type AppRouter = typeof appRouter;
