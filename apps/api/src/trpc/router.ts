import { router, publicProcedure } from './index';
import { authRouter } from './routers/auth';
import { linksRouter } from './routers/links';
import { credentialsRouter } from './routers/credentials';
import { tagsRouter } from './routers/tags';
import { activityLogsRouter } from './routers/activity-logs';
import { dataExportRouter } from './routers/data-export';
import { notesRouter } from './routers/notes';
import { categoriesRouter } from './routers/categories';
import { securityPinRouter } from './routers/security-pin';
import { projectsRouter } from './routers/projects';

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
  dataExport: dataExportRouter,
  notes: notesRouter,
  categories: categoriesRouter,
  securityPin: securityPinRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
