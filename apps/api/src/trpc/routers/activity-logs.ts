import { eq, desc, and } from 'drizzle-orm';
import { parse, object, optional, pipe, string, minLength } from 'valibot';
import { db } from '../../db';
import { activityLogs } from '../../db/schema';
import { router, protectedProcedure } from '../index';

export const activityLogsRouter = router({
  // Get all activity logs for the current user
  getAll: protectedProcedure
    .input((raw) =>
      parse(
        object({
          limit: optional(pipe(string(), minLength(1))),
          resourceType: optional(pipe(string(), minLength(1))),
        }),
        raw
      )
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ? parseInt(input.limit) : 50;

      const where = input.resourceType
        ? and(
            eq(activityLogs.userId, ctx.user.id),
            eq(activityLogs.resourceType, input.resourceType)
          )
        : eq(activityLogs.userId, ctx.user.id);

      const logs = await db.query.activityLogs.findMany({
        where,
        orderBy: [desc(activityLogs.createdAt)],
        limit,
      });

      return logs;
    }),

  // Get activity logs for a specific resource
  getByResource: protectedProcedure
    .input((raw) =>
      parse(
        object({
          resourceId: pipe(string(), minLength(1)),
        }),
        raw
      )
    )
    .query(async ({ ctx, input }) => {
      const logs = await db.query.activityLogs.findMany({
        where: and(
          eq(activityLogs.userId, ctx.user.id),
          eq(activityLogs.resourceId, input.resourceId)
        ),
        orderBy: [desc(activityLogs.createdAt)],
      });

      return logs;
    }),
});
