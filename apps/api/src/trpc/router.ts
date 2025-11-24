import { router, publicProcedure } from './index';
import { authRouter } from './routers/auth';
import { linksRouter } from './routers/links';
import { credentialsRouter } from './routers/credentials';
import { tagsRouter } from './routers/tags';
import { activityLogsRouter } from './routers/activity-logs';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
  auth: authRouter,
  links: linksRouter,
  credentials: credentialsRouter,
  tags: tagsRouter,
  activityLogs: activityLogsRouter,
});

export type AppRouter = typeof appRouter;
