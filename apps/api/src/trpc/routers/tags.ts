import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse } from 'valibot';
import { TagCreateSchema, TagUpdateSchema, TagDeleteSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { tags, linkTags, credentialTags } from '../../db/schema';
import { router, protectedProcedure } from '../index';

export const tagsRouter = router({
  // Get all tags for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, ctx.user.id),
      orderBy: [desc(tags.createdAt)],
    });

    return userTags;
  }),

  // Create a new tag
  create: protectedProcedure
    .input((raw) => parse(TagCreateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const tagId = generateId(15);

      await db.insert(tags).values({
        id: tagId,
        userId: ctx.user.id,
        name: input.name,
        color: input.color,
      });

      return { success: true, id: tagId };
    }),

  // Update a tag
  update: protectedProcedure
    .input((raw) => parse(TagUpdateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)),
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      await db
        .update(tags)
        .set({
          name: input.name,
          color: input.color,
        })
        .where(eq(tags.id, input.id));

      return { success: true };
    }),

  // Delete a tag (and all its associations)
  delete: protectedProcedure
    .input((raw) => parse(TagDeleteSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, input.id), eq(tags.userId, ctx.user.id)),
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      // Delete tag (cascade will handle link_tags and credential_tags)
      await db.delete(tags).where(eq(tags.id, input.id));

      return { success: true };
    }),
});
