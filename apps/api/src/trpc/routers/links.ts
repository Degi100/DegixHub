import { eq, and, desc, inArray } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse, array, object, pipe, string, minLength, number } from 'valibot';
import { LinkCreateSchema, LinkUpdateSchema, LinkDeleteSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { links, linkTags, tags } from '../../db/schema';
import { router, protectedProcedure } from '../index';
import { logActivity } from '../../lib/activity-logger';
import { fetchLinkMetadata } from '../../lib/meta-fetcher';

export const linksRouter = router({
  // Get all links for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userLinks = await db.query.links.findMany({
      where: eq(links.userId, ctx.user.id),
      orderBy: [desc(links.isPinned), desc(links.createdAt)],
    });

    // Get tags for each link
    const linksWithTags = await Promise.all(
      userLinks.map(async (link) => {
        const linkTagRecords = await db
          .select({ tagId: linkTags.tagId })
          .from(linkTags)
          .where(eq(linkTags.linkId, link.id));

        if (linkTagRecords.length === 0) {
          return { ...link, tags: [] };
        }

        const tagIds = linkTagRecords.map((lt) => lt.tagId);
        const linkTagsData = await db
          .select()
          .from(tags)
          .where(inArray(tags.id, tagIds));

        return { ...link, tags: linkTagsData };
      })
    );

    return linksWithTags;
  }),

  // Get links by category
  getByCategory: protectedProcedure
    .input((raw) => parse(object({ category: pipe(string(), minLength(1)) }), raw))
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
        favicon: input.favicon || null,
        linkedCredentialId: input.linkedCredentialId || null,
      });

      // Assign tags if provided
      if (input.tagIds && input.tagIds.length > 0) {
        const tagValues = input.tagIds.map((tagId) => ({
          linkId,
          tagId,
        }));
        await db.insert(linkTags).values(tagValues);
      }

      // Log activity - created link
      await logActivity({
        userId: ctx.user.id,
        action: 'created',
        resourceType: 'link',
        resourceId: linkId,
        resourceName: input.name,
        metadata: { url: input.url, category: input.category },
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

      // Log activity - updated link
      await logActivity({
        userId: ctx.user.id,
        action: 'updated',
        resourceType: 'link',
        resourceId: input.id,
        resourceName: input.name,
        oldValue: JSON.stringify({ name: link.name, url: link.url, category: link.category }),
        newValue: JSON.stringify({ name: input.name, url: input.url, category: input.category }),
      });

      await db
        .update(links)
        .set({
          name: input.name,
          url: input.url,
          category: input.category,
          description: input.description || null,
          favicon: input.favicon || null,
          linkedCredentialId: input.linkedCredentialId || null,
          updatedAt: new Date(),
        })
        .where(eq(links.id, input.id));

      // Update tags: delete existing and insert new ones
      if (input.tagIds !== undefined) {
        // Delete existing tag assignments
        await db.delete(linkTags).where(eq(linkTags.linkId, input.id));

        // Insert new tag assignments
        if (input.tagIds.length > 0) {
          const tagValues = input.tagIds.map((tagId) => ({
            linkId: input.id,
            tagId,
          }));
          await db.insert(linkTags).values(tagValues);
        }
      }

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

      // Log activity - deleted link
      await logActivity({
        userId: ctx.user.id,
        action: 'deleted',
        resourceType: 'link',
        resourceId: input.id,
        resourceName: link.name,
        oldValue: JSON.stringify({ name: link.name, url: link.url, category: link.category }),
      });

      await db.delete(links).where(eq(links.id, input.id));

      return { success: true };
    }),

  // Bulk import links
  import: protectedProcedure
    .input((raw) => parse(array(LinkCreateSchema), raw))
    .mutation(async ({ ctx, input }) => {
      const linkValues = input.map((link) => ({
        id: generateId(15),
        userId: ctx.user.id,
        name: link.name,
        url: link.url,
        category: link.category,
        description: link.description || null,
      }));

      await db.insert(links).values(linkValues);

      return { success: true, count: linkValues.length };
    }),

  // Fetch metadata for a URL
  fetchMetadata: protectedProcedure
    .input((raw) => parse(object({ url: pipe(string(), minLength(1)) }), raw))
    .mutation(async ({ input }) => {
      const metadata = await fetchLinkMetadata(input.url);
      return metadata;
    }),

  // Bulk delete links
  bulkDelete: protectedProcedure
    .input((raw) => parse(object({ ids: array(string()) }), raw))
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 0) {
        return { success: true, count: 0 };
      }

      // Verify ownership of all links
      const userLinks = await db.query.links.findMany({
        where: and(inArray(links.id, input.ids), eq(links.userId, ctx.user.id)),
      });

      if (userLinks.length !== input.ids.length) {
        throw new Error('Some links not found or unauthorized');
      }

      // Log activity for bulk delete
      await logActivity({
        userId: ctx.user.id,
        action: 'bulk_deleted',
        resourceType: 'link',
        resourceId: null,
        metadata: { count: input.ids.length, ids: input.ids },
      });

      // Delete link tags first (foreign key constraint)
      await db.delete(linkTags).where(inArray(linkTags.linkId, input.ids));

      // Delete links
      await db.delete(links).where(inArray(links.id, input.ids));

      return { success: true, count: input.ids.length };
    }),

  // Bulk assign tags to links
  bulkAssignTags: protectedProcedure
    .input((raw) =>
      parse(
        object({
          linkIds: array(string()),
          tagIds: array(string()),
        }),
        raw
      )
    )
    .mutation(async ({ ctx, input }) => {
      if (input.linkIds.length === 0 || input.tagIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Verify ownership of all links
      const userLinks = await db.query.links.findMany({
        where: and(inArray(links.id, input.linkIds), eq(links.userId, ctx.user.id)),
      });

      if (userLinks.length !== input.linkIds.length) {
        throw new Error('Some links not found or unauthorized');
      }

      // Create all combinations of linkId and tagId
      const tagValues: Array<{ linkId: string; tagId: string }> = [];
      for (const linkId of input.linkIds) {
        for (const tagId of input.tagIds) {
          // Check if already exists to avoid duplicates
          const existing = await db.query.linkTags.findFirst({
            where: and(eq(linkTags.linkId, linkId), eq(linkTags.tagId, tagId)),
          });

          if (!existing) {
            tagValues.push({ linkId, tagId });
          }
        }
      }

      if (tagValues.length > 0) {
        await db.insert(linkTags).values(tagValues);
      }

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: 'bulk_tag_assigned',
        resourceType: 'link',
        resourceId: null,
        metadata: {
          linkCount: input.linkIds.length,
          tagCount: input.tagIds.length,
          assignedCount: tagValues.length,
        },
      });

      return { success: true, count: tagValues.length };
    }),

  // Toggle pin status
  togglePin: protectedProcedure
    .input((raw) => parse(object({ id: string() }), raw))
    .mutation(async ({ ctx, input }) => {
      // Get current link
      const link = await db.query.links.findFirst({
        where: and(eq(links.id, input.id), eq(links.userId, ctx.user.id)),
      });

      if (!link) {
        throw new Error('Link not found');
      }

      // Toggle pin status
      const newPinStatus = !link.isPinned;
      await db
        .update(links)
        .set({ isPinned: newPinStatus })
        .where(eq(links.id, input.id));

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: newPinStatus ? 'pinned' : 'unpinned',
        resourceType: 'link',
        resourceId: input.id,
        resourceName: link.name,
      });

      return { success: true, isPinned: newPinStatus };
    }),

  // Update pin order for drag & drop sorting
  updatePinOrder: protectedProcedure
    .input((raw) =>
      parse(
        object({
          items: array(object({ id: string(), pinOrder: number() })),
        }),
        raw
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of all links
      const linkIds = input.items.map((item) => item.id);
      const userLinks = await db.query.links.findMany({
        where: and(inArray(links.id, linkIds), eq(links.userId, ctx.user.id)),
      });

      if (userLinks.length !== linkIds.length) {
        throw new Error('Some links not found or unauthorized');
      }

      // Update pin order for each link
      for (const item of input.items) {
        await db
          .update(links)
          .set({ pinOrder: item.pinOrder })
          .where(eq(links.id, item.id));
      }

      return { success: true };
    }),
});
