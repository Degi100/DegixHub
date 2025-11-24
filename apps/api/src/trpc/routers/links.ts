import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse } from 'valibot';
import { LinkCreateSchema, LinkUpdateSchema, LinkDeleteSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { links } from '../../db/schema';
import { router, protectedProcedure } from '../index';

export const linksRouter = router({
  // Get all links for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userLinks = await db.query.links.findMany({
      where: eq(links.userId, ctx.user.id),
      orderBy: [desc(links.createdAt)],
    });

    return userLinks;
  }),

  // Get links by category
  getByCategory: protectedProcedure
    .input((raw) => parse({ category: raw as string }))
    .query(async ({ ctx, input }) => {
      const userLinks = await db.query.links.findMany({
        where: and(eq(links.userId, ctx.user.id), eq(links.category, input.category)),
        orderBy: [desc(links.createdAt)],
      });

      return userLinks;
    }),

  // Create a new link
  create: protectedProcedure
    .input((raw) => parse(LinkCreateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const linkId = generateId(15);

      await db.insert(links).values({
        id: linkId,
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        category: input.category,
        description: input.description || null,
      });

      return { success: true, id: linkId };
    }),

  // Update a link
  update: protectedProcedure
    .input((raw) => parse(LinkUpdateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const link = await db.query.links.findFirst({
        where: and(eq(links.id, input.id), eq(links.userId, ctx.user.id)),
      });

      if (!link) {
        throw new Error('Link not found');
      }

      await db
        .update(links)
        .set({
          name: input.name,
          url: input.url,
          category: input.category,
          description: input.description || null,
        })
        .where(eq(links.id, input.id));

      return { success: true };
    }),

  // Delete a link
  delete: protectedProcedure
    .input((raw) => parse(LinkDeleteSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const link = await db.query.links.findFirst({
        where: and(eq(links.id, input.id), eq(links.userId, ctx.user.id)),
      });

      if (!link) {
        throw new Error('Link not found');
      }

      await db.delete(links).where(eq(links.id, input.id));

      return { success: true };
    }),
});
